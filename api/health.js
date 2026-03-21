import { proxyProviderRequest } from "./_providerProxy.js";

export default async function handler(req, res) {
  return proxyProviderRequest(req, res, "/health");
}
