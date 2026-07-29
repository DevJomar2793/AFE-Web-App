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
    name: "Retail and WholeSale Eggs",
    eyebrow: "Premium Eggs",
    description: "Premium eggs for your cooking needs.",
    price: "Php 200.00",
    image: "/AFE-Eggs.png",
    alt: "Egg in the eggtray",
  },
  {
    name: "1.5 and 350 Palm Oil",
    eyebrow: "Cooking favorite",
    description: "Premium palm oil for your cooking needs.",
    price: "Php 150.00 / Php 40.00",
    image: "/AFE-Oil.png",
    alt: "Palm Oil",
  },
  {
    name: "Bataan Special Tuyo",
    eyebrow: "Cooking Favorite",
    description: "Premium tuyo for your cooking needs.",
    price: "Php 250.00",
    image: "/AFE-Tuyo.png",
    alt: "Tuyo",
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
