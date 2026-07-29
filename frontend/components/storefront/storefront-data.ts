export type Product = {
  name: string;
  description: string;
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
    description: "Premium eggs for your cooking needs.",
    image: "/AFE-Eggs.png",
    alt: "Egg in the eggtray",
  },
  {
    name: "1.5 and 350 Palm Oil",
    description: "Premium palm oil for your cooking needs.",
    image: "/AFE-Oil.png",
    alt: "Palm Oil",
  },
  {
    name: "Bataan Special Tuyo",
    description: "Premium tuyo for your cooking needs.",
    image: "/AFE-Tuyo.png",
    alt: "Tuyo",
  },
];

export const navigationItems: NavigationItem[] = [
  { label: "Mission & Vision", href: "#promise" },
  { label: "Products", href: "#products" },
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
