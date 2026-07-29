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

export type CustomerOrder = {
  customerName: string;
  customerType: "Business" | "Household";
  quantity: number;
  productName: string;
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
  { label: "Mission & Vision", href: "#promise" },
  { label: "Our eggs", href: "#products" },
  { label: "Customer Orders", href: "#orders" },
  { label: "Contact", href: "#contact" },
];

export const customerOrders: CustomerOrder[] = [
  {
    customerName: "Keisha Carpio",
    customerType: "Business",
    quantity: 4,
    productName: "Medium Retail Eggs",
  },
  {
    customerName: "Ginalyn Arradaza",
    customerType: "Business",
    quantity: 3,
    productName: "Extra Large Retail Eggs",
  },
  {
    customerName: "Maemae Borcelas",
    customerType: "Household",
    quantity: 2,
    productName: "Small Retail Eggs",
  },
  {
    customerName: "Queenie Ibe",
    customerType: "Household",
    quantity: 1,
    productName: "Extra Large Retail Eggs",
  },
  {
    customerName: "Noemie De Ag",
    customerType: "Household",
    quantity: 3,
    productName: "Medium Retail Eggs",
  },
  {
    customerName: "Echo Villanueva",
    customerType: "Household",
    quantity: 3,
    productName: "Small Retail Eggs",
  },
];

export const contactEmail = "jomarcerrado2793@gmail.com";
