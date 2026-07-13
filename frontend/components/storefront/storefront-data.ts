export type Product = {
  name: string;
  eyebrow: string;
  description: string;
  price: string;
  image: string;
  alt: string;
};

export type NavigationItem = {
  label: string;
  href: string;
};

export const products: Product[] = [
  {
    name: "Pasture-Raised Brown Eggs",
    eyebrow: "Farm favorite",
    description: "A dozen sturdy-shelled eggs gathered from hens rotated across open pasture.",
    price: "$7.99",
    image: "/product-brown-eggs.png",
    alt: "Open carton of brown pasture-raised eggs on a wooden table",
  },
  {
    name: "Half-Dozen Heirloom Eggs",
    eyebrow: "Small batch",
    description: "Mixed cream, tan, and light brown eggs selected for breakfasts and baking.",
    price: "$4.49",
    image: "/product-heirloom-eggs.png",
    alt: "Half-dozen tray of mixed heirloom eggs on rustic linen",
  },
  {
    name: "Farm-to-Table Subscription",
    eyebrow: "Weekly option",
    description: "A recurring crate of fresh eggs with flexible pickup or local delivery.",
    price: "$24/mo",
    image: "/product-subscription.png",
    alt: "Reusable crate filled with eggs and linen for a farm subscription",
  },
];

export const navigationItems: NavigationItem[] = [
  { label: "Our promise", href: "#promise" },
  { label: "Our eggs", href: "#products" },
  { label: "Farm life", href: "#farm" },
  { label: "Contact", href: "#contact" },
];

export const contactEmail = "jomarcerrado2793@gmail.com";
