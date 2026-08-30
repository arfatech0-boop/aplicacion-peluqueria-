export type ProductUnit = 'un' | 'kg' | 'gr' | 'lt' | 'mt' | 'm2' | 'caja' | 'pack' | 'docena' | 'hs' | 'serv' | 'juego' | 'atado' | 'cajón' | 'horma';

export type TaxCondition = 'Responsable Inscripto' | 'Monotributo' | 'Exento' | 'Consumidor Final / General';

export type BusinessRubro = 
  | 'Supermercado / Almacén'
  | 'Carnicería / Fiambrería & Granja'
  | 'Verdulería / Frutería'
  | 'Kiosco / Drugstore'
  | 'Ferretería / Corralón'
  | 'Indumentaria / Calzado'
  | 'Electrónica / Computación'
  | 'Gastronomía / Panadería'
  | 'Farmacia / Perfumería'
  | 'Autopartes / Repuestos'
  | 'Servicios / Profesional'
  | 'Comercio General / Multirrubro';

export interface Product {
  id: string;
  code: string; // Barcode or SKU
  name: string;
  category: string;
  supplierId: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: ProductUnit;
  size?: string;  // Talle / Medida
  color?: string; // Color / Variante
  brand?: string; // Marca / Fabricante
  description?: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  cuit: string;
  phone: string;
  email: string;
  contact: string;
  notes?: string;
}

export interface GlobalPriceIncreaseLog {
  id: string;
  supplierId: string;
  supplierName: string;
  categoryFilter?: string;
  percentage: number;
  applyToCost: boolean;
  applyToSale: boolean;
  recalculateMargin: boolean;
  affectedProductsCount: number;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  dniCuit: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  currentBalance: number; // Positive = owes money, Negative = credit in favor
  notes?: string;
  updatedAt: string;
}

export type CustomerTransactionType = 'sale' | 'payment' | 'adjustment' | 'withdrawal_billing';

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: CustomerTransactionType;
  amount: number;
  balanceAfter: number;
  date: string;
  description: string;
  saleId?: string;
  withdrawalId?: string;
  receiptNumber?: string;
}

export type WithdrawalStatus = 'pending' | 'billed' | 'returned';

export interface WithdrawalItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerWithdrawal {
  id: string;
  withdrawalNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: WithdrawalItem[];
  totalAmount: number;
  status: WithdrawalStatus;
  notes?: string;
  authorizedBy?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'cheque' | 'current_account' | 'mixed';

export type InvoiceType = 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'TICKET_X' | 'REMITO';

export interface SaleItem {
  productId: string;
  code: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string; // e.g., FC-0001-00001234
  invoiceType?: InvoiceType;
  cae?: string;
  caeDueDate?: string;
  customerCuitDni?: string;
  customerTaxCondition?: TaxCondition;
  date: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  surcharge?: number;
  cardBankName?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentsBreakdown?: { method: PaymentMethod; amount: number }[];
  notes?: string;
  status: 'completed' | 'cancelled' | 'annulled';
  amountPaidCash?: number;
  changeDue?: number;
}

export type ChequeStatus = 'pending' | 'in_wallet' | 'deposited' | 'cashed' | 'endorsed' | 'rejected';

export interface Cheque {
  id: string;
  number: string;
  bank: string;
  issuerName: string;
  issuerCuit?: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: ChequeStatus;
  notes?: string;
}

export interface CashMovement {
  id: string;
  type: 'in' | 'out';
  amount: number;
  description: string;
  category: 'sale' | 'customer_payment' | 'supplier_payment' | 'expense' | 'withdrawal' | 'annulment' | 'other';
  date: string;
  paymentMethod: PaymentMethod;
}

export interface CashRegister {
  id: string;
  openDate: string;
  closeDate?: string;
  initialAmount: number;
  cashSales: number;
  accountPayments: number;
  cashExpenses: number;
  expectedTotal: number;
  actualTotal?: number;
  difference?: number;
  status: 'open' | 'closed';
  movements: CashMovement[];
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjust' | 'sale' | 'withdrawal';
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  reason: string;
}

export interface CardInterestPlan {
  id: string;
  name: string;
  surchargePercent: number;
  description?: string;
}

export interface StoreInfo {
  name: string;
  cuit: string;
  taxCondition: TaxCondition;
  businessType: BusinessRubro;
  address: string;
  phone: string;
  email: string;
  invoicePrefix: string;
  currencySymbol: string;
  defaultTaxRate: number;
  cashDiscountPercent: number;
  cardSurchargePercent: number;
  receiptHeaderMessage: string;
  customCategories: string[];
  defaultCounterInvoiceType?: InvoiceType;
  defaultCurrentAccountInvoiceType?: InvoiceType;
  defaultRespInscriptoInvoiceType?: InvoiceType;
  afipPointOfSale?: string;
  cardInterestPlans?: CardInterestPlan[];
}

export interface StoreAccount {
  id: string;
  name: string;
  cuit: string;
  businessType: BusinessRubro;
  address: string;
  phone: string;
  email: string;
  active: boolean;
  isDemo?: boolean;
  trialExpiresAt?: string;
  status?: 'active' | 'trial' | 'expired' | 'suspended';
  createdAt: string;
}

export type UserRole = 'admin' | 'cashier' | 'manager';

export interface SystemUser {
  id: string;
  storeId?: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
  isDemo?: boolean;
  trialExpiresAt?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AppState {
  currentStoreId?: string;
  currentUserId?: string;
  stores?: StoreAccount[];
  storeInfo: StoreInfo;
  products: Product[];
  suppliers: Supplier[];
  priceIncreaseLogs: GlobalPriceIncreaseLog[];
  customers: Customer[];
  customerTransactions: CustomerTransaction[];
  withdrawals: CustomerWithdrawal[];
  sales: Sale[];
  cheques: Cheque[];
  cashRegisters: CashRegister[];
  stockMovements: StockMovement[];
  users: SystemUser[];
}
