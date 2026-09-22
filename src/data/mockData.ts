import { AppState } from '../types';

export const initialAppData: AppState = {
  storeInfo: {
    name: "Comercial Central Pro",
    cuit: "30-71234567-8",
    taxCondition: "Responsable Inscripto",
    businessType: "Comercio General / Multirrubro",
    address: "Av. San Martín 1450, Ciudad",
    phone: "011 4589-2310",
    email: "ventas@comercialcentral.com",
    invoicePrefix: "0001",
    currencySymbol: "$",
    defaultTaxRate: 21,
    cashDiscountPercent: 5,
    cardSurchargePercent: 10,
    receiptHeaderMessage: "¡Gracias por su compra! Conserve este comprobante.",
    defaultCounterInvoiceType: "FACTURA_B",
    defaultCurrentAccountInvoiceType: "REMITO",
    defaultRespInscriptoInvoiceType: "FACTURA_A",
    afipPointOfSale: "0001",
    cardInterestPlans: [
      { id: 'p1', name: 'Débito / 1 Pago Efectivo', surchargePercent: 0, description: 'Sin recargo' },
      { id: 'p2', name: 'Visa / Mastercard 1 Pago', surchargePercent: 5, description: 'Recargo contado Posnet' },
      { id: 'p3', name: 'Mercado Pago / QR', surchargePercent: 8, description: 'Tasa cobro digital' },
      { id: 'p4', name: '3 Cuotas (Cuota Simple)', surchargePercent: 15, description: 'Plan nacional 3 pagos' },
      { id: 'p5', name: '6 Cuotas Financiamiento', surchargePercent: 28, description: 'Plan banco 6 pagos' },
      { id: 'p6', name: '12 Cuotas Larga Duración', surchargePercent: 42, description: 'Plan banco 12 pagos' },
    ],
    customCategories: [
      "Bazar & Hogar",
      "Electrónica",
      "Regalería",
      "Librería",
      "Kiosco",
      "Bebidas"
    ]
  },
  suppliers: [
    {
      id: "sup-1",
      name: "Distribuidora Central S.A.",
      cuit: "30-58912344-2",
      phone: "011 4782-9900",
      email: "pedidos@distribuidoracentral.com",
      contact: "Roberto Gómez",
      notes: "Proveedor principal de bazar, electrónica y bebidas"
    }
  ],
  products: [
    {
      id: "prod-gen-1",
      code: "779888999001",
      name: "Termo de Acero Inoxidable 1 Litro",
      category: "Bazar & Hogar",
      supplierId: "sup-1",
      costPrice: 12500,
      salePrice: 22000,
      stock: 18,
      minStock: 5,
      unit: "un",
      brand: "Stanley / Lumilagro",
      description: "Termo de doble pared con pico cebador cebado continuo 24hs frío/calor",
      updatedAt: new Date().toISOString()
    },
    {
      id: "prod-gen-2",
      code: "779888999002",
      name: "Auriculares Inalámbricos Bluetooth TWS",
      category: "Electrónica",
      supplierId: "sup-1",
      costPrice: 8900,
      salePrice: 16500,
      stock: 25,
      minStock: 6,
      unit: "un",
      brand: "Xiaomi / TWS",
      description: "Auriculares estéreo con estuche de carga USB-C",
      updatedAt: new Date().toISOString()
    },
    {
      id: "prod-gen-3",
      code: "779888999003",
      name: "Caja de Chocolates Surtidos 250g",
      category: "Regalería",
      supplierId: "sup-1",
      costPrice: 4200,
      salePrice: 7800,
      stock: 30,
      minStock: 10,
      unit: "un",
      brand: "Ferrero / Bon o Bon",
      description: "Bombones y chocolates surtidos en caja para regalo",
      updatedAt: new Date().toISOString()
    },
    {
      id: "prod-gen-4",
      code: "779888999004",
      name: "Pack x12 Lapiceras Tinta Gel 0.5mm",
      category: "Librería",
      supplierId: "sup-1",
      costPrice: 2100,
      salePrice: 4200,
      stock: 40,
      minStock: 10,
      unit: "pack",
      brand: "BIC / Faber-Castell",
      description: "Bolígrafos trazo fino colores surtidos",
      updatedAt: new Date().toISOString()
    },
    {
      id: "prod-gen-5",
      code: "779888999005",
      name: "Golosinas Surtidas Display Alfajores x12",
      category: "Kiosco",
      supplierId: "sup-1",
      costPrice: 5500,
      salePrice: 9600,
      stock: 15,
      minStock: 5,
      unit: "caja",
      brand: "Guaymallén / Havanna",
      description: "Caja display alfajores de dulce de leche con baño de chocolate",
      updatedAt: new Date().toISOString()
    },
    {
      id: "prod-gen-6",
      code: "779888999006",
      name: "Bebida Energizante 473ml Pack x6",
      category: "Bebidas",
      supplierId: "sup-1",
      costPrice: 6000,
      salePrice: 10800,
      stock: 20,
      minStock: 8,
      unit: "pack",
      brand: "Speed / Red Bull",
      description: "Latas de bebida energizante fría",
      updatedAt: new Date().toISOString()
    }
  ],
  priceIncreaseLogs: [
    {
      id: "inc-1",
      supplierId: "sup-2",
      supplierName: "Materiales del Norte S.A.",
      percentage: 12.5,
      applyToCost: true,
      applyToSale: true,
      recalculateMargin: true,
      affectedProductsCount: 2,
      date: "2026-07-25T14:30:00.000Z"
    }
  ],
  customers: [
    {
      id: "cust-1",
      name: "Constructora Horizon S.R.L.",
      dniCuit: "30-78112233-4",
      phone: "011 4455-6677",
      email: "administracion@constructorahorizon.com",
      address: "Calle Los Ciruelos 450",
      creditLimit: 500000,
      currentBalance: 185000, // Owes 185.000
      notes: "Cliente corporativo habitual. Pago a 30 días",
      updatedAt: "2026-08-05T12:00:00.000Z"
    },
    {
      id: "cust-2",
      name: "Juan Carlos Pérez (Electricidad)",
      dniCuit: "20-28991234-8",
      phone: "011 15-6789-0123",
      email: "jcperez.elec@gmail.com",
      address: "Av. Belgrano 1280",
      creditLimit: 150000,
      currentBalance: 42500, // Owes 42.500
      notes: "Contratista de obras particulares",
      updatedAt: "2026-08-04T16:00:00.000Z"
    },
    {
      id: "cust-3",
      name: "María Elena Soria",
      dniCuit: "27-31445566-3",
      phone: "011 15-4123-9876",
      email: "maria.soria@hotmail.com",
      address: "Mitre 890, 2do B",
      creditLimit: 80000,
      currentBalance: 0, // Al día
      notes: "Cliente final recurrente",
      updatedAt: "2026-08-01T09:00:00.000Z"
    }
  ],
  customerTransactions: [
    {
      id: "tx-1",
      customerId: "cust-1",
      type: "sale",
      amount: 215000,
      balanceAfter: 215000,
      date: "2026-07-28T11:00:00.000Z",
      description: "Venta FC-0001-00001042 a Cuenta Corriente",
      saleId: "sale-101"
    },
    {
      id: "tx-2",
      customerId: "cust-1",
      type: "payment",
      amount: 30000,
      balanceAfter: 185000,
      date: "2026-08-02T15:30:00.000Z",
      description: "Pago parcial de cuenta corriente - Transferencia",
      receiptNumber: "REC-0001-0089"
    },
    {
      id: "tx-3",
      customerId: "cust-2",
      type: "sale",
      amount: 42500,
      balanceAfter: 42500,
      date: "2026-08-04T16:00:00.000Z",
      description: "Venta FC-0001-00001048 a Cuenta Corriente",
      saleId: "sale-102"
    }
  ],
  withdrawals: [
    {
      id: "with-1",
      withdrawalNumber: "RET-0001-00045",
      customerId: "cust-1",
      customerName: "Constructora Horizon S.R.L.",
      date: "2026-08-03T10:15:00.000Z",
      items: [
        {
          productId: "prod-1",
          productCode: "779123456001",
          productName: "Cemento Portland 50kg Loma Negra",
          quantity: 10,
          unitPrice: 10500,
          totalPrice: 105000
        },
        {
          productId: "prod-2",
          productCode: "779123456002",
          productName: "Cal Hidratada 25kg Horcajo",
          quantity: 5,
          unitPrice: 4200,
          totalPrice: 21000
        }
      ],
      totalAmount: 126000,
      status: "pending",
      notes: "Retirado por capataz Miguel Ángel. Pendiente de facturar a fin de mes.",
      authorizedBy: "Carlos Gómez (Encargado)"
    }
  ],
  sales: [
    {
      id: "sale-201",
      invoiceNumber: "FC-0001-00001050",
      date: "2026-08-06T10:30:00.000Z",
      customerId: "cust-3",
      customerName: "María Elena Soria",
      items: [
        {
          productId: "prod-3",
          code: "779123456003",
          productName: "Pintura Látex Interior Blanco 20L",
          quantity: 1,
          unitPrice: 42000,
          costPrice: 28000,
          subtotal: 42000
        },
        {
          productId: "prod-4",
          code: "779123456004",
          productName: "Esmalte Sintético 4L Satinado",
          quantity: 1,
          unitPrice: 16500,
          costPrice: 11000,
          subtotal: 16500
        }
      ],
      subtotal: 58500,
      discount: 0,
      totalAmount: 58500,
      paymentMethod: "cash",
      status: "completed",
      notes: "Venta contado mostrador"
    },
    {
      id: "sale-202",
      invoiceNumber: "FC-0001-00001051",
      date: "2026-08-06T14:15:00.000Z",
      customerId: "cust-2",
      customerName: "Juan Carlos Pérez (Electricidad)",
      items: [
        {
          productId: "prod-6",
          code: "779123456006",
          productName: "Taladro Percutor 750W 13mm",
          quantity: 1,
          unitPrice: 72000,
          costPrice: 48000,
          subtotal: 72000
        },
        {
          productId: "prod-7",
          code: "779123456007",
          productName: "Discos de Corte Metal 115mm (Pack x10)",
          quantity: 2,
          unitPrice: 7500,
          costPrice: 4500,
          subtotal: 15000
        }
      ],
      subtotal: 87000,
      discount: 2000,
      totalAmount: 85000,
      paymentMethod: "transfer",
      status: "completed",
      notes: "Descuento por pago contado transferencia"
    },
    {
      id: "sale-203",
      invoiceNumber: "FC-0001-00001049",
      date: "2026-08-05T17:40:00.000Z",
      items: [
        {
          productId: "prod-1",
          code: "779123456001",
          productName: "Cemento Portland 50kg Loma Negra",
          quantity: 5,
          unitPrice: 10500,
          costPrice: 7500,
          subtotal: 52500
        }
      ],
      subtotal: 52500,
      discount: 0,
      totalAmount: 52500,
      paymentMethod: "card",
      status: "completed"
    }
  ],
  cheques: [
    {
      id: "chq-1",
      number: "00849120",
      bank: "Banco Galicia",
      issuerName: "Constructora Horizon S.R.L.",
      issuerCuit: "30-78112233-4",
      customerId: "cust-1",
      customerName: "Constructora Horizon S.R.L.",
      amount: 120000,
      issueDate: "2026-08-01T00:00:00.000Z",
      dueDate: "2026-08-15T00:00:00.000Z",
      status: "in_wallet",
      notes: "Cheque diferido entregado a cuenta de factura anterior"
    },
    {
      id: "chq-2",
      number: "11928340",
      bank: "Banco Nación",
      issuerName: "Instalaciones SRL",
      amount: 75000,
      issueDate: "2026-07-20T00:00:00.000Z",
      dueDate: "2026-08-05T00:00:00.000Z",
      status: "cashed",
      notes: "Cobrado por ventanilla el 05/08"
    }
  ],
  cashRegisters: [
    {
      id: "cash-today",
      openDate: "2026-08-06T08:00:00.000Z",
      initialAmount: 25000,
      cashSales: 58500,
      accountPayments: 0,
      cashExpenses: 5000,
      expectedTotal: 78500,
      status: "open",
      movements: [
        {
          id: "mov-1",
          type: "in",
          amount: 58500,
          description: "Venta FC-0001-00001050 (Efectivo)",
          category: "sale",
          date: "2026-08-06T10:30:00.000Z",
          paymentMethod: "cash"
        },
        {
          id: "mov-2",
          type: "out",
          amount: 5000,
          description: "Flete local envíos de insumos",
          category: "expense",
          date: "2026-08-06T11:45:00.000Z",
          paymentMethod: "cash"
        }
      ],
      notes: "Caja abierta de turno mañana/tarde"
    }
  ],
  stockMovements: [
    {
      id: "sm-1",
      productId: "prod-3",
      productName: "Pintura Látex Interior Blanco 20L",
      type: "sale",
      quantity: 1,
      previousStock: 13,
      newStock: 12,
      date: "2026-08-06T10:30:00.000Z",
      reason: "Venta FC-0001-00001050"
    },
    {
      id: "sm-2",
      productId: "prod-4",
      productName: "Esmalte Sintético 4L Satinado",
      type: "sale",
      quantity: 1,
      previousStock: 4,
      newStock: 3,
      date: "2026-08-06T10:30:00.000Z",
      reason: "Venta FC-0001-00001050"
    },
    {
      id: "sm-3",
      productId: "prod-1",
      productName: "Cemento Portland 50kg Loma Negra",
      type: "withdrawal",
      quantity: 10,
      previousStock: 55,
      newStock: 45,
      date: "2026-08-03T10:15:00.000Z",
      reason: "Retiro de cliente Constructora Horizon (RET-0001-00045)"
    }
  ],
  users: [
    {
      id: "user-admin-default",
      username: "admin",
      password: "123",
      name: "Administrador Principal",
      role: "admin",
      active: true,
      createdAt: "2026-08-01T00:00:00.000Z"
    },
    {
      id: "user-facu",
      username: "facu123",
      password: "12345",
      name: "Facundo (Personal)",
      role: "admin",
      active: true,
      createdAt: new Date().toISOString()
    }
  ]
};
