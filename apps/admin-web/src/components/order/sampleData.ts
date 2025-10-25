export interface OrderItem {
  Productid: string;
  Productname: string;
  Quantity: number;
  Price: number; 
  ItemTotalPrice: number; 
  Shopid: string;
  Shopname: string;
}
export interface Order {
  Orderid: string;
  Userid: string;
  Cusname: string;
  items: OrderItem[]; 
  TotalPrice: number; 
  TotalItems: number;
  Status: "Pending" | "Processing" | "Cancelled" | "Delivering" | "Delivered" | "Returned" | "Complaints";
  CreationDate: string;
  CompletionDate: string;
  PaymentStatus: 'Paid' | 'Unpaid';
  CanConfirm: boolean;
}

const calculateItemTotalPrice = (quantity: number, price: number): number => quantity * price;

const calculateOrderSummary = (items: OrderItem[]) => {
  const TotalPrice = items.reduce((sum, item) => sum + item.ItemTotalPrice, 0);
  const TotalItems = items.reduce((sum, item) => sum + item.Quantity, 0);
  return { TotalPrice, TotalItems };
}

const createOrderItem = (
  productid: string,
  productname: string,
  quantity: number,
  price: number,
  shopid: string,
  shopname: string
): OrderItem => ({
  Productid: productid,
  Productname: productname,
  Quantity: quantity,
  Price: price,
  ItemTotalPrice: calculateItemTotalPrice(quantity, price), 
  Shopid: shopid,
  Shopname: shopname,
});

const order1Items = [
  createOrderItem("PR001A", "Áo Thun Trắng", 1, 100000, "SH001", "ABC Store"),
  createOrderItem("PR001B", "Quần Jeans Xanh", 2, 350000, "SH001", "ABC Store"),
];
const order1Summary = calculateOrderSummary(order1Items);

const order2Items = [
  createOrderItem("PR002C", "Điện Thoại ip17", 1, 50000000, "SH002", "Tech World"),
];
const order2Summary = calculateOrderSummary(order2Items);

const order3Items = [
  createOrderItem("PR003A", "Sách Lập Trình", 3, 200000, "SH003", "Bookworm"),
  createOrderItem("PR003B", "Bút Ký", 5, 50000, "SH003", "Bookworm"),
];
const order3Summary = calculateOrderSummary(order3Items);

export const sampleOrders: Order[] = [
 {
        Orderid: "OD001",
        Userid: "US001",
        Cusname: "Hieu",
        Status: "Pending",
        CreationDate: "01/01/2025",
        CompletionDate: "11/01/2025",
        PaymentStatus: 'Unpaid',
        CanConfirm: false,
        items: order1Items,
        TotalPrice: order1Summary.TotalPrice, 
        TotalItems: order1Summary.TotalItems, 
    },
    {
        Orderid: "OD002",
        Userid: "US002",
        Cusname: "Hieu2",
        Status: "Processing",
        CreationDate: "02/02/2025",
        CompletionDate: "12/02/2025",
        PaymentStatus: 'Paid',
        CanConfirm: false,
        items: order2Items,
        TotalPrice: order2Summary.TotalPrice,
        TotalItems: order2Summary.TotalItems, 
    },
    { 
        Orderid: "OD003", 
        Userid : "US003",
        Cusname: "Hieu3",
        Status: "Cancelled", 
        CreationDate: "03/03/2025", 
        CompletionDate: "13/03/2025", 
        PaymentStatus: 'Paid',
        CanConfirm: false,
        items: order3Items,
        TotalPrice: order3Summary.TotalPrice,
        TotalItems: order3Summary.TotalItems, 
    },

    { 
        Orderid: "OD004", 
        Userid : "US004",
        Cusname: "US004",
        Status: "Delivered", 
        CreationDate: "03/03/2025", 
        CompletionDate: "13/03/2025", 
        PaymentStatus: 'Paid',
        CanConfirm: false,
        items: order3Items,
        TotalPrice: order3Summary.TotalPrice,
        TotalItems: order3Summary.TotalItems, 
    },
];