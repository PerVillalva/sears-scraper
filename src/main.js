// For more information, see https://crawlee.dev/
import { HttpCrawler, ProxyConfiguration } from "crawlee";
import { router } from "./routes.js";

const startUrls = [
  {
    url: "https://www.sears.com/api/sal/v3/products/browse/category?catGroupId=1020006&storeId=10153",
    label: "CATEGORIES",
  },
];

const crawler = new HttpCrawler({
  // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
  requestHandler: router,
});

await crawler.run(startUrls);
