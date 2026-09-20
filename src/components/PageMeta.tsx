import { useEffect } from "react";
import { SITE_NAME, SITE_URL } from "../lib/site";

type PageMetaProps = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function PageMeta({
  title,
  description,
  path = "",
  noIndex = false,
}: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`;
    const metaDescription =
      description ??
      "AI permitting agent for Los Angeles residential work — ADUs, garage conversions, and small additions.";
    const canonicalUrl = new URL(path, SITE_URL).toString();
    const ogImage = new URL("/og-image.jpg", SITE_URL).toString();

    document.title = fullTitle;

    setMetaTag("name", "description", metaDescription);
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", metaDescription);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("property", "og:site_name", SITE_NAME);
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", metaDescription);
    setMetaTag("name", "twitter:image", ogImage);
    setMetaTag(
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow",
    );

    setLinkTag("canonical", canonicalUrl);
  }, [title, description, path, noIndex]);

  return null;
}

function setMetaTag(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function setLinkTag(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  );

  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
}
