export interface Order {
  Orderid: string;
  Userid: string;
  Shopid: string;
  Productid: string;
  TotalPrice: number;
  Status: "Pending" | "Processing" | "Cancelled" | "Delivering" | "Delivered" | "Returned" | "Complaints";
  CreationDate: string;
  CompletionDate: string;
  TotalItems: number; 
  PaymentStatus: 'Paid' | 'Unpaid'; 
  CanConfirm: boolean; // 
}

export const sampleOrders: Order[] = [
  { 
    Orderid: "OD001", 
    Userid : "US001",
    Shopid : "SH001",
    Productid : "PR001",
    TotalPrice: 1000000, 
    Status: "Pending", 
    CreationDate: "1/01/2025", 
    CompletionDate: "11/01/2025", 
    TotalItems: 1, 
    PaymentStatus: 'Paid',
    CanConfirm: false 
  },
   { 
    Orderid: "OD002", 
    Userid : "US002",
    Shopid : "SH002",
    Productid : "PR002",
    TotalPrice: 1200000, 
    Status: "Processing", 
    CreationDate: "2/02/2025", 
    CompletionDate: "12/02/2025", 
    TotalItems: 2, 
    PaymentStatus: 'Paid',
    CanConfirm: false 
  },
   { 
    Orderid: "OD003", 
    Userid : "US003",
    Shopid : "SH003",
    Productid : "PR003",
    TotalPrice: 1230000, 
    Status: "Cancelled", 
    CreationDate: "3/03/2025", 
    CompletionDate: "13/03/2025", 
    TotalItems: 3, 
    PaymentStatus: 'Paid',
    CanConfirm: false 
  },
   { 
    Orderid: "OD004", 
    Userid : "US004",
    Shopid : "SH004",
    Productid : "PR004",
    TotalPrice: 1234000, 
    Status: "Delivering", 
    CreationDate: "4/04/2025", 
    CompletionDate: "14/04/2025", 
    TotalItems: 4, 
    PaymentStatus: 'Paid',
    CanConfirm: false 
  },
   { 
    Orderid: "OD005", 
    Userid : "US005",
    Shopid : "SH005",
    Productid : "PR005",
    TotalPrice: 1234500, 
    Status: "Delivered", 
    CreationDate: "5/05/2025", 
    CompletionDate: "15/05/2025", 
    TotalItems: 5, 
    PaymentStatus: 'Paid',
    CanConfirm: false 
  },
  { 
    Orderid: "OD006", 
    Userid : "US006",
    Shopid : "SH006",
    Productid : "PR006",
    TotalPrice: 1234560, 
    Status: "Returned", 
    CreationDate: "6/06/2025", 
    CompletionDate: "16/06/2025", 
    TotalItems: 6, 
    PaymentStatus: 'Paid',
    CanConfirm: false 
  },
  { 
    Orderid: "OD007", 
    Userid : "US007",
    Shopid : "SH007",
    Productid : "PR007",
    TotalPrice: 1234567, 
    Status: "Complaints", 
    CreationDate: "7/07/2025", 
    CompletionDate: "17/07/2025", 
    TotalItems: 7, 
    PaymentStatus: 'Paid',
    CanConfirm: true 
  },
];