import { Dataset, createHttpRouter } from "crawlee";

export const router = createHttpRouter();

router.addHandler("CATEGORIES", async ({ crawler, log, json }) => {
  const { categoryBrowseRespV2 } = json;
  log.info("Enqueuing subcategories.");

  const categories =
    categoryBrowseRespV2.globalNavigation.currentNode.childNodes;
  const categoryIds = categories.map((obj) => {
    return obj.catgroupId.split("/")[1];
  });

  for (const categoryId of categoryIds) {
    crawler.requestQueue.addRequest({
      url: `https://www.sears.com/api/sal/v3/products/search?startIndex=1&endIndex=1200&searchType=category&storeId=10153&filterValueLimit=1000&includeFiltersInd=true&shipOrDelivery=true&sortBy=ORIGINAL_SORT_ORDER&catGroupId=${categoryId}`,
      label: "CATEGORY GROUP",
    });
  }
});

router.addHandler("CATEGORY GROUP", async ({ crawler, log, json }) => {
  log.info("Enqueuing subcategory product groups.");
  const { items } = json;

  for (const categoryGroupItem of items) {
    const productID = categoryGroupItem.additionalAttributes.sin;

    crawler.requestQueue.addRequest({
      url: `https://www.sears.com/api/sal/v3/products/details/${productID}?storeName=Sears`,
      label: "PRODUCT DETAILS",
    });
  }
});

router.addHandler("PRODUCT DETAILS", async ({ log, json }) => {
  const { productDetail } = json;
  try {
    const productInformation = productDetail.softhardProductdetails[0];
    log.info(
      `Extracting data from product webpage -  https://www.sears.com${productInformation.seoUrl}`
    );
    const results = {
      productUrl: `https://www.sears.com${productInformation.seoUrl}`,
      brand: productInformation.brandName,
      name: productInformation.descriptionName,
      salePrice: `$${productInformation.salePrice}`,
      regularPrice: `$${productInformation.regularPrice}`,
      description: productInformation.shortDescription,
      sellerName: "",
      sellerProfileUrl: "",
      categories: {
        mainCategory: productInformation.hierarchies.specificHierarchy[0],
        categoryGroup: productInformation.hierarchies.specificHierarchy[1],
        productGroup: productInformation.hierarchies.specificHierarchy[2],
        productSubGroup: productInformation.hierarchies.specificHierarchy[3],
      },
    };

    if (productInformation.defaultSeller !== null) {
      results.sellerName = productInformation.defaultSeller.sellerName;
      results.sellerProfileUrl = `https://www.sears.com${productInformation.defaultSeller.storeFrontUrlName}`;
    } else {
      results.sellerName = "Seller information not available.";
      results.sellerProfileUrl = "Seller information not available.";
    }
    await Dataset.pushData({
      results,
    });
  } catch (e) {
    log.info("Product unavailable");
  }
});
