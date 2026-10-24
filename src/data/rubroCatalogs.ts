import { Product, BusinessRubro, Supplier } from '../types';

export const DEFAULT_KIOSCO_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-kio-arcor',
    name: 'Arcor S.A.I.C. (Golosinas & Chocolates)',
    cuit: '30-50279317-5',
    phone: '0800-444-2726',
    email: 'pedidos@arcor.com.ar',
    contact: 'Preventista Golosinas',
    notes: 'Alfajores, Chocolates, Gomitas Mogul, Galletitas Bagley'
  },
  {
    id: 'sup-kio-coca',
    name: 'Coca-Cola FEMSA Argentina (Bebidas)',
    cuit: '30-50362947-6',
    phone: '0800-888-2652',
    email: 'femsa_pedidos@kioscos.com.ar',
    contact: 'Preventa Ruta Kioscos',
    notes: 'Coca-Cola, Sprite, Fanta, Monster Energy, Aquarius'
  },
  {
    id: 'sup-kio-massalin',
    name: 'Massalin Particulares S.R.L. (Tabaco & Encendedores)',
    cuit: '30-50005721-8',
    phone: '0800-222-7445',
    email: 'tabaco@massalin.com.ar',
    contact: 'Ventas Mayoristas Tabaco',
    notes: 'Marlboro, Philip Morris, Chesterfield, Encendedores Bic'
  },
  {
    id: 'sup-kio-pepsi',
    name: 'PepsiCo Snacks Argentina (Lays / Doritos)',
    cuit: '30-54637281-9',
    phone: '0800-777-7377',
    email: 'ventas@pepsico.com.ar',
    contact: 'Distribuidor Snacks & Papas',
    notes: 'Papas Lays, Doritos, Cheetos, Twistos, Galletas Oreo'
  },
  {
    id: 'sup-kio-quilmes',
    name: 'Cervecería y Maltería Quilmes (Bebidas & Aguas)',
    cuit: '30-50349887-8',
    phone: '0800-222-2337',
    email: 'contacto@quilmes.com.ar',
    contact: 'Distribución Bebidas Frías',
    notes: 'Quilmes, Brahma, Stella Artois, Villavicencio'
  }
];

export const RUBRO_CATALOGS: Record<string, Product[]> = {
  'Comercio General / Multirrubro': [
    {
      id: 'prod-gen-1',
      code: '779888999001',
      name: 'Termo de Acero Inoxidable 1 Litro',
      category: 'Bazar & Hogar',
      supplierId: 'sup-1',
      costPrice: 12500,
      salePrice: 22000,
      stock: 18,
      minStock: 5,
      unit: 'un',
      brand: 'Stanley / Lumilagro',
      description: 'Termo de doble pared con pico cebador cebado continuo 24hs frío/calor',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-gen-2',
      code: '779888999002',
      name: 'Auriculares Inalámbricos Bluetooth TWS',
      category: 'Electrónica',
      supplierId: 'sup-1',
      costPrice: 8900,
      salePrice: 16500,
      stock: 25,
      minStock: 6,
      unit: 'un',
      brand: 'Xiaomi / TWS',
      description: 'Auriculares estéreo con estuche de carga USB-C',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-gen-3',
      code: '779888999003',
      name: 'Caja de Chocolates Surtidos 250g',
      category: 'Regalería',
      supplierId: 'sup-1',
      costPrice: 4200,
      salePrice: 7800,
      stock: 30,
      minStock: 10,
      unit: 'un',
      brand: 'Ferrero / Bon o Bon',
      description: 'Bombones y chocolates surtidos en caja para regalo',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-gen-4',
      code: '779888999004',
      name: 'Pack x12 Lapiceras Tinta Gel 0.5mm',
      category: 'Librería',
      supplierId: 'sup-1',
      costPrice: 2100,
      salePrice: 4200,
      stock: 40,
      minStock: 10,
      unit: 'pack',
      brand: 'BIC / Faber-Castell',
      description: 'Bolígrafos trazo fino colores surtidos',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-gen-5',
      code: '779888999005',
      name: 'Golosinas Surtidas Display Alfajores x12',
      category: 'Kiosco',
      supplierId: 'sup-1',
      costPrice: 5500,
      salePrice: 9600,
      stock: 15,
      minStock: 5,
      unit: 'caja',
      brand: 'Guaymallén / Havanna',
      description: 'Caja display alfajores de dulce de leche con baño de chocolate',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-gen-6',
      code: '779888999006',
      name: 'Bebida Energizante 473ml Pack x6',
      category: 'Bebidas',
      supplierId: 'sup-1',
      costPrice: 6000,
      salePrice: 10800,
      stock: 20,
      minStock: 8,
      unit: 'pack',
      brand: 'Speed / Red Bull',
      description: 'Latas de bebida energizante fría',
      updatedAt: new Date().toISOString()
    }
  ],

  'Indumentaria / Calzado': [
    {
      id: 'prod-ind-1',
      code: '779111222001',
      name: 'Remera Algodón Peinado Manga Corta',
      category: 'Remeras & Tops',
      supplierId: 'sup-1',
      costPrice: 8500,
      salePrice: 14500,
      stock: 24,
      minStock: 8,
      unit: 'un',
      size: 'M',
      color: 'Negro',
      brand: "Levi's",
      description: 'Remera lisa 100% algodón peinado 24/1 corte regular fit',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-2',
      code: '779111222002',
      name: 'Jean Slim Fit Stretch Talle 42',
      category: 'Pantalones & Jeans',
      supplierId: 'sup-1',
      costPrice: 18000,
      salePrice: 29900,
      stock: 15,
      minStock: 5,
      unit: 'un',
      size: '42',
      color: 'Azul Denim',
      brand: 'Wrangler',
      description: 'Pantalón jean elastizado 5 bolsillos con lavado localizado',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-3',
      code: '779111222003',
      name: 'Buzo Friado Canguro con Capucha',
      category: 'Buzos & Abrigos',
      supplierId: 'sup-1',
      costPrice: 22000,
      salePrice: 36500,
      stock: 10,
      minStock: 4,
      unit: 'un',
      size: 'L',
      color: 'Gris Topo',
      brand: 'Nike',
      description: 'Buzo de frisa invisible gruesa, con bolsillos pasantes y capucha ajustables',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-4',
      code: '779111222004',
      name: 'Zapatillas Urbanas Canvas T. 41',
      category: 'Calzado & Zapatillas',
      supplierId: 'sup-1',
      costPrice: 28000,
      salePrice: 48000,
      stock: 8,
      minStock: 3,
      unit: 'un',
      size: '41',
      color: 'Blanco',
      brand: 'Adidas',
      description: 'Calzado urbano con suela de goma vulcanizada antideslizante',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-5',
      code: '779111222005',
      name: 'Camisa Lino Premium Manga Larga',
      category: 'Remeras & Tops',
      supplierId: 'sup-1',
      costPrice: 15000,
      salePrice: 25000,
      stock: 12,
      minStock: 4,
      unit: 'un',
      size: 'L',
      color: 'Celeste',
      brand: 'Zara',
      description: 'Camisa entallada slim en tejido fresco de lino y algodón',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-6',
      code: '779111222006',
      name: 'Campera Puffer Abrigo Impermeable',
      category: 'Buzos & Abrigos',
      supplierId: 'sup-1',
      costPrice: 38000,
      salePrice: 62000,
      stock: 6,
      minStock: 2,
      unit: 'un',
      size: 'XL',
      color: 'Negro',
      brand: 'Columbia',
      description: 'Campera inflable térmica con matelassé y cierre reforzado',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-7',
      code: '779111222007',
      name: 'Vestido Casual Verano Escote V',
      category: 'Remeras & Tops',
      supplierId: 'sup-1',
      costPrice: 14000,
      salePrice: 24500,
      stock: 9,
      minStock: 3,
      unit: 'un',
      size: 'S',
      color: 'Rojo',
      brand: 'Zara',
      description: 'Vestido corto fluido confeccionado en viscosa liviana',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-8',
      code: '779111222008',
      name: 'Pantalón Jogging Rústico con Puño',
      category: 'Pantalones & Jeans',
      supplierId: 'sup-1',
      costPrice: 12500,
      salePrice: 21000,
      stock: 18,
      minStock: 6,
      unit: 'un',
      size: 'L',
      color: 'Azul Marino',
      brand: 'Puma',
      description: 'Pantalón de algodón rústico sin frisa para uso diario',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-9',
      code: '779111222009',
      name: 'Cinturón Cuero Vacuno Grafilado',
      category: 'Accesorios & Bolsos',
      supplierId: 'sup-1',
      costPrice: 6000,
      salePrice: 11500,
      stock: 14,
      minStock: 5,
      unit: 'un',
      size: '95cm',
      color: 'Marrón Suela',
      brand: 'Prüne',
      description: 'Cinturón 100% cuero legítimo con hebilla de níquel satinado',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ind-10',
      code: '779111222010',
      name: 'Pack x3 Medias Invisibles Algodón',
      category: 'Ropa Interior',
      supplierId: 'sup-1',
      costPrice: 2500,
      salePrice: 4800,
      stock: 30,
      minStock: 10,
      unit: 'pack',
      size: '39-43',
      color: 'Surtido',
      brand: 'Dufour',
      description: 'Soquetes invisibles de toalla con talón antideslizante',
      updatedAt: new Date().toISOString()
    }
  ],

  'Ferretería / Corralón': [
    {
      id: 'prod-fer-1',
      code: '779123456001',
      name: 'Cemento Portland 50kg Loma Negra',
      category: 'Materiales de Construcción',
      supplierId: 'sup-2',
      costPrice: 7500,
      salePrice: 10500,
      stock: 45,
      minStock: 20,
      unit: 'un',
      size: '50 kg',
      brand: 'Loma Negra',
      description: 'Bolsa de cemento hidratado de alto rendimiento 50kg',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-fer-2',
      code: '779123456002',
      name: 'Cal Hidratada 25kg Horcajo',
      category: 'Materiales de Construcción',
      supplierId: 'sup-2',
      costPrice: 2800,
      salePrice: 4200,
      stock: 6,
      minStock: 15,
      unit: 'un',
      size: '25 kg',
      brand: 'Horcajo',
      description: 'Bolsa de cal común hidratada para construcción',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-fer-3',
      code: '779123456003',
      name: 'Pintura Látex Interior Blanco 20L',
      category: 'Pinturería & Revestimientos',
      supplierId: 'sup-3',
      costPrice: 28000,
      salePrice: 42000,
      stock: 12,
      minStock: 5,
      unit: 'un',
      size: '20 Litros',
      color: 'Blanco Mate',
      brand: 'Albalatex',
      description: 'Látex super lavable blanco mate para interiores',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-fer-4',
      code: '779123456004',
      name: 'Esmalte Sintético 4L Satinado',
      category: 'Pinturería & Revestimientos',
      supplierId: 'sup-3',
      costPrice: 11000,
      salePrice: 16500,
      stock: 3,
      minStock: 8,
      unit: 'un',
      size: '4 Litros',
      color: 'Negro Satinado',
      brand: 'Tersuave',
      description: 'Esmalte antioxidante para maderas y metales',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-fer-5',
      code: '779123456005',
      name: 'Juego Grifería Monocomando Cocina',
      category: 'Plomería & Sanitarios',
      supplierId: 'sup-1',
      costPrice: 35000,
      salePrice: 52000,
      stock: 8,
      minStock: 4,
      unit: 'un',
      brand: 'FV',
      description: 'Monocomando pico alto metálico cromado FV',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-fer-6',
      code: '779123456006',
      name: 'Taladro Percutor 750W 13mm',
      category: 'Herramientas Eléctricas',
      supplierId: 'sup-1',
      costPrice: 48000,
      salePrice: 72000,
      stock: 5,
      minStock: 3,
      unit: 'un',
      size: '13mm',
      brand: 'DeWalt',
      description: 'Taladro industrial velocidad variable e inversión de giro',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-fer-7',
      code: '779123456007',
      name: 'Discos de Corte Metal 115mm (Pack x10)',
      category: 'Ferretería General',
      supplierId: 'sup-1',
      costPrice: 4500,
      salePrice: 7500,
      stock: 25,
      minStock: 10,
      unit: 'pack',
      size: '115mm',
      brand: 'Bosch',
      description: 'Discos ultra finos 1mm para amoladora angular',
      updatedAt: new Date().toISOString()
    }
  ],

  'Supermercado / Almacén': [
    {
      id: 'prod-sup-1',
      code: '779000111001',
      name: 'Aceite de Girasol 1.5L Cañuelas',
      category: 'Almacén',
      supplierId: 'sup-1',
      costPrice: 1800,
      salePrice: 2700,
      stock: 35,
      minStock: 10,
      unit: 'un',
      brand: 'Cañuelas',
      description: 'Aceite de girasol purificado 1.5 litros',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-sup-2',
      code: '779000111002',
      name: 'Leche Entera 1L Tetra La Serenísima',
      category: 'Lácteos & Quesos',
      supplierId: 'sup-1',
      costPrice: 1100,
      salePrice: 1650,
      stock: 50,
      minStock: 15,
      unit: 'un',
      brand: 'La Serenísima',
      description: 'Leche ultra pasteurizada fortificada con Calcio y Vitaminas',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-sup-3',
      code: '779000111003',
      name: 'Queso Cremoso x Kg Barra',
      category: 'Lácteos & Quesos',
      supplierId: 'sup-1',
      costPrice: 6500,
      salePrice: 9800,
      stock: 18,
      minStock: 5,
      unit: 'kg',
      brand: 'Punta del Agua',
      description: 'Queso cremoso suave ideal para pizzas y tartas',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-sup-4',
      code: '779000111004',
      name: 'Gaseosa Cola 2.25L Retornable',
      category: 'Bebidas & Gaseosas',
      supplierId: 'sup-1',
      costPrice: 1900,
      salePrice: 2800,
      stock: 40,
      minStock: 12,
      unit: 'un',
      brand: 'Coca-Cola',
      description: 'Gaseosa sabor original envase retornable',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-sup-5',
      code: '779000111005',
      name: 'Fideos Tallarín 500g Matarazzo',
      category: 'Almacén',
      supplierId: 'sup-1',
      costPrice: 850,
      salePrice: 1350,
      stock: 60,
      minStock: 20,
      unit: 'un',
      brand: 'Matarazzo',
      description: 'Fideos de sémola de trigo candeal',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-sup-6',
      code: '779000111006',
      name: 'Jabón Líquido Ropa 3L Ala Ecobolsa',
      category: 'Limpieza & Hogar',
      supplierId: 'sup-1',
      costPrice: 5200,
      salePrice: 7900,
      stock: 14,
      minStock: 6,
      unit: 'un',
      brand: 'Ala',
      description: 'Jabón para lavarropas automático con suavizante',
      updatedAt: new Date().toISOString()
    }
  ],

  'Electrónica / Computación': [
    {
      id: 'prod-elec-1',
      code: '779222333001',
      name: 'Smartphone 128GB 6.5" Pantalla AMOLED',
      category: 'Celulares & Tablets',
      supplierId: 'sup-1',
      costPrice: 220000,
      salePrice: 340000,
      stock: 6,
      minStock: 2,
      unit: 'un',
      brand: 'Samsung',
      color: 'Negro Phantom',
      description: 'Celular liberado Octa-Core 8GB RAM Cámara 50MP',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-elec-2',
      code: '779222333002',
      name: 'Notebook Core i5 16GB RAM SSD 512GB 15.6"',
      category: 'Laptops & Computadoras',
      supplierId: 'sup-1',
      costPrice: 650000,
      salePrice: 890000,
      stock: 4,
      minStock: 2,
      unit: 'un',
      brand: 'Lenovo',
      color: 'Gris Plata',
      description: 'Computadora portátil pantalla Full HD Windows 11',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-elec-3',
      code: '779222333003',
      name: 'Teclado Mecánico Gaming RGB Switch Blue',
      category: 'Periféricos & Teclados',
      supplierId: 'sup-1',
      costPrice: 28000,
      salePrice: 45000,
      stock: 12,
      minStock: 4,
      unit: 'un',
      brand: 'Redragon',
      description: 'Teclado retroiluminado teclas antighosting metálico',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-elec-4',
      code: '779222333004',
      name: 'Auriculares Bluetooth In-Ear Cancelación Ruido',
      category: 'Audio & Auriculares',
      supplierId: 'sup-1',
      costPrice: 32000,
      salePrice: 54000,
      stock: 15,
      minStock: 5,
      unit: 'un',
      brand: 'JBL',
      color: 'Negro',
      description: 'Auriculares inalámbricos TWS con estuche de carga rápida',
      updatedAt: new Date().toISOString()
    }
  ],

  'Gastronomía / Panadería': [
    {
      id: 'prod-gas-1',
      code: '779333444001',
      name: 'Docena Medialunas de Manteca Artesanales',
      category: 'Facturas & Dulces',
      supplierId: 'sup-1',
      costPrice: 3200,
      salePrice: 5800,
      stock: 25,
      minStock: 5,
      unit: 'un',
      description: 'Medialunas hojaldradas con almíbar de azahar frescas del día',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-gas-2',
      code: '779333444002',
      name: 'Pan Francés x Kg',
      category: 'Panificados & Harinas',
      supplierId: 'sup-1',
      costPrice: 1200,
      salePrice: 2200,
      stock: 40,
      minStock: 10,
      unit: 'kg',
      description: 'Pan crocante elaborado con harina 000 de primera calidad',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-gas-3',
      code: '779333444003',
      name: 'Tarta de Jamón, Queso y Huevo Entera',
      category: 'Platos Elaborados',
      supplierId: 'sup-1',
      costPrice: 4500,
      salePrice: 8500,
      stock: 8,
      minStock: 2,
      unit: 'un',
      description: 'Tarta salada casera con masa hojaldrada y abundante relleno',
      updatedAt: new Date().toISOString()
    }
  ],

  'Autopartes / Repuestos': [
    {
      id: 'prod-auto-1',
      code: '779444555001',
      name: 'Aceite Sintético 10W40 4 Litros Engine Protect',
      category: 'Filtros & Aceites',
      supplierId: 'sup-1',
      costPrice: 28000,
      salePrice: 42000,
      stock: 15,
      minStock: 5,
      unit: 'un',
      brand: 'Elaion / YPF',
      description: 'Lubricante sintético multicamada para motores nafta y diésel',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-auto-2',
      code: '779444555002',
      name: 'Juego Pastillas de Freno Delanteras',
      category: 'Frenos & Embragues',
      supplierId: 'sup-1',
      costPrice: 19000,
      salePrice: 32000,
      stock: 8,
      minStock: 3,
      unit: 'un',
      brand: 'Bosch',
      description: 'Pastillas de freno cerámicas silenciosas alta eficiencia',
      updatedAt: new Date().toISOString()
    }
  ],

  'Servicios / Profesional': [
    {
      id: 'prod-serv-1',
      code: '779555666001',
      name: 'Servicio de Mantenimiento Preventivo / Hora',
      category: 'Mantenimiento & Reparaciones',
      supplierId: 'sup-1',
      costPrice: 12000,
      salePrice: 22000,
      stock: 100,
      minStock: 10,
      unit: 'un',
      description: 'Servicio técnico especializado en sitio por hora de trabajo',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-serv-2',
      code: '779555666002',
      name: 'Abono Mensual de Soporte Integral',
      category: 'Abonos Mensuales',
      supplierId: 'sup-1',
      costPrice: 45000,
      salePrice: 85000,
      stock: 50,
      minStock: 5,
      unit: 'un',
      description: 'Soporte preventivo y correctivo mensual prioritario',
      updatedAt: new Date().toISOString()
    }
  ],

  'Carnicería / Fiambrería & Granja': [
    {
      id: 'prod-car-1',
      code: '779600100001',
      name: 'Asado de Tira Especial x Kg',
      category: 'Cortes Vacunos',
      supplierId: 'sup-1',
      costPrice: 6200,
      salePrice: 9400,
      stock: 45,
      minStock: 10,
      unit: 'kg',
      brand: 'Frigorífico Central',
      description: 'Corte de asado vacuno novillito de primera calidad',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-car-2',
      code: '779600100002',
      name: 'Nalgas para Milanesas Feteada x Kg',
      category: 'Cortes Vacunos',
      supplierId: 'sup-1',
      costPrice: 7100,
      salePrice: 10800,
      stock: 30,
      minStock: 8,
      unit: 'kg',
      brand: 'Frigorífico Central',
      description: 'Nalga tierna feteada fina especial para milanesas',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-car-3',
      code: '779600100003',
      name: 'Pechuga de Pollo Fresca x Kg',
      category: 'Aves & Granja',
      supplierId: 'sup-1',
      costPrice: 4200,
      salePrice: 6500,
      stock: 25,
      minStock: 6,
      unit: 'kg',
      brand: 'Granja San Sebastián',
      description: 'Pechugas deshuesadas limpias de pollo de granja',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-car-4',
      code: '779600100004',
      name: 'Jamón Cocido Fiambrería x Kg',
      category: 'Fiambres & Fiambrería',
      supplierId: 'sup-1',
      costPrice: 5800,
      salePrice: 8900,
      stock: 12,
      minStock: 4,
      unit: 'kg',
      brand: 'Paladini',
      description: 'Jamón cocido natural feteado a elección',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-car-5',
      code: '779600100005',
      name: 'Queso Tybo de Barra x Kg',
      category: 'Quesos x Kg',
      supplierId: 'sup-1',
      costPrice: 6400,
      salePrice: 9600,
      stock: 15,
      minStock: 5,
      unit: 'kg',
      brand: 'La Serenísima / Verónica',
      description: 'Queso feteado ideal para sándwiches y fiambres',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-car-6',
      code: '779600100006',
      name: 'Chorizos de Cerdo Artesanales x Kg',
      category: 'Embutidos & Achuras',
      supplierId: 'sup-1',
      costPrice: 4500,
      salePrice: 7200,
      stock: 20,
      minStock: 5,
      unit: 'kg',
      brand: 'Elaboración Propia',
      description: 'Chorizos puros de cerdo especiados sin TACC',
      updatedAt: new Date().toISOString()
    }
  ],

  'Verdulería / Frutería': [
    {
      id: 'prod-ver-1',
      code: '779700100001',
      name: 'Papa Negra Selección x Kg',
      category: 'Hortalizas & Tubérculos',
      supplierId: 'sup-1',
      costPrice: 450,
      salePrice: 850,
      stock: 120,
      minStock: 25,
      unit: 'kg',
      description: 'Papa de lavada pesada seleccionada por kilo',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ver-2',
      code: '779700100002',
      name: 'Tomate Redondo Comercial x Kg',
      category: 'Hortalizas & Tubérculos',
      supplierId: 'sup-1',
      costPrice: 1200,
      salePrice: 1950,
      stock: 60,
      minStock: 15,
      unit: 'kg',
      description: 'Tomate frito y de ensalada fresco de quinta',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ver-3',
      code: '779700100003',
      name: 'Banana Ecuador Premium x Kg',
      category: 'Frutas de Estación',
      supplierId: 'sup-1',
      costPrice: 1100,
      salePrice: 1800,
      stock: 40,
      minStock: 10,
      unit: 'kg',
      description: 'Banana madura de importación dulce',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-ver-4',
      code: '779700100004',
      name: 'Lechuga Capuchina x Atado',
      category: 'Verduras de Hoja',
      supplierId: 'sup-1',
      costPrice: 600,
      salePrice: 1100,
      stock: 30,
      minStock: 8,
      unit: 'atado',
      description: 'Planta de lechuga fresca de quinta',
      updatedAt: new Date().toISOString()
    }
  ],

  'Kiosco / Drugstore': [
    {
      id: 'prod-kio-1',
      code: '779800100001',
      name: 'Alfajor Guaymallén Triple Chocolate 70g',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 450,
      salePrice: 800,
      stock: 60,
      minStock: 15,
      unit: 'un',
      brand: 'Guaymallén',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-2',
      code: '779800100002',
      name: 'Alfajor Havanna 70% Cacao Puro',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 1200,
      salePrice: 2000,
      stock: 30,
      minStock: 10,
      unit: 'un',
      brand: 'Havanna',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-3',
      code: '779800100003',
      name: 'Alfajor Capitán del Espacio Triple',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 700,
      salePrice: 1200,
      stock: 45,
      minStock: 12,
      unit: 'un',
      brand: 'Capitán del Espacio',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-4',
      code: '779800100004',
      name: 'Chocolate Bon o Bon Blanco x16g',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 250,
      salePrice: 500,
      stock: 70,
      minStock: 20,
      unit: 'un',
      brand: 'Arcor',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-5',
      code: '779800100005',
      name: 'Chocolate Block Cofler 38g',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 650,
      salePrice: 1100,
      stock: 40,
      minStock: 10,
      unit: 'un',
      brand: 'Cofler',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-6',
      code: '779800100006',
      name: 'Turrón de Maní Arcor 25g',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 180,
      salePrice: 350,
      stock: 80,
      minStock: 25,
      unit: 'un',
      brand: 'Arcor',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-7',
      code: '779800100007',
      name: 'Gomitas Mogul Frutales 30g',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 300,
      salePrice: 550,
      stock: 50,
      minStock: 15,
      unit: 'un',
      brand: 'Mogul',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-8',
      code: '779800100008',
      name: 'Chicles Beldent Menta Fuerte x18 unidades',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 500,
      salePrice: 900,
      stock: 50,
      minStock: 15,
      unit: 'un',
      brand: 'Beldent',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-9',
      code: '779800100009',
      name: 'Pastillas Halls Mentol Extra Fuerte',
      category: 'Golosinas & Chocolates',
      supplierId: 'sup-kio-arcor',
      costPrice: 350,
      salePrice: 650,
      stock: 45,
      minStock: 15,
      unit: 'un',
      brand: 'Halls',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-10',
      code: '779800100010',
      name: 'Galletitas Oreo 118g',
      category: 'Galletitas & Snacks',
      supplierId: 'sup-kio-pepsi',
      costPrice: 900,
      salePrice: 1500,
      stock: 35,
      minStock: 10,
      unit: 'un',
      brand: 'Oreo',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-11',
      code: '779800100011',
      name: 'Galletitas Chocolinas 170g',
      category: 'Galletitas & Snacks',
      supplierId: 'sup-kio-arcor',
      costPrice: 1100,
      salePrice: 1800,
      stock: 30,
      minStock: 10,
      unit: 'un',
      brand: 'Bagley',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-12',
      code: '779800100012',
      name: 'Papas Fritas Lays Clásicas 85g',
      category: 'Galletitas & Snacks',
      supplierId: 'sup-kio-pepsi',
      costPrice: 1200,
      salePrice: 2000,
      stock: 30,
      minStock: 10,
      unit: 'un',
      brand: 'Lays',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-13',
      code: '779800100013',
      name: 'Doritos Mega Queso 85g',
      category: 'Galletitas & Snacks',
      supplierId: 'sup-kio-pepsi',
      costPrice: 1300,
      salePrice: 2100,
      stock: 25,
      minStock: 8,
      unit: 'un',
      brand: 'Doritos',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-14',
      code: '779800100014',
      name: 'Gaseosa Coca-Cola Original 500ml',
      category: 'Bebidas & Energizantes',
      supplierId: 'sup-kio-coca',
      costPrice: 950,
      salePrice: 1600,
      stock: 60,
      minStock: 20,
      unit: 'un',
      brand: 'Coca-Cola',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-15',
      code: '779800100015',
      name: 'Gaseosa Coca-Cola Sin Azúcar 500ml',
      category: 'Bebidas & Energizantes',
      supplierId: 'sup-kio-coca',
      costPrice: 950,
      salePrice: 1600,
      stock: 40,
      minStock: 15,
      unit: 'un',
      brand: 'Coca-Cola',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-16',
      code: '779800100016',
      name: 'Gaseosa Sprite Lima-Limón 500ml',
      category: 'Bebidas & Energizantes',
      supplierId: 'sup-kio-coca',
      costPrice: 900,
      salePrice: 1500,
      stock: 35,
      minStock: 12,
      unit: 'un',
      brand: 'Sprite',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-17',
      code: '779800100017',
      name: 'Agua Mineral Villavicencio sin Gas 500ml',
      category: 'Bebidas & Energizantes',
      supplierId: 'sup-kio-quilmes',
      costPrice: 500,
      salePrice: 950,
      stock: 50,
      minStock: 15,
      unit: 'un',
      brand: 'Villavicencio',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-18',
      code: '779800100018',
      name: 'Bebida Energizante Monster Energy 473ml',
      category: 'Bebidas & Energizantes',
      supplierId: 'sup-kio-coca',
      costPrice: 1500,
      salePrice: 2500,
      stock: 30,
      minStock: 10,
      unit: 'un',
      brand: 'Monster Energy',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-19',
      code: '779800100019',
      name: 'Cerveza Quilmes Clásica Lata 473ml',
      category: 'Bebidas & Energizantes',
      supplierId: 'sup-kio-quilmes',
      costPrice: 1100,
      salePrice: 1900,
      stock: 48,
      minStock: 16,
      unit: 'un',
      brand: 'Quilmes',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-20',
      code: '779800100020',
      name: 'Cigarrillos Marlboro Box 20',
      category: 'Cigarrillos & Tabaco',
      supplierId: 'sup-kio-massalin',
      costPrice: 2600,
      salePrice: 3200,
      stock: 50,
      minStock: 15,
      unit: 'un',
      brand: 'Marlboro',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-21',
      code: '779800100021',
      name: 'Cigarrillos Philip Morris Box 20',
      category: 'Cigarrillos & Tabaco',
      supplierId: 'sup-kio-massalin',
      costPrice: 2400,
      salePrice: 2950,
      stock: 45,
      minStock: 15,
      unit: 'un',
      brand: 'Philip Morris',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-kio-22',
      code: '779800100022',
      name: 'Encendedor Bic Maxi',
      category: 'Artículos de Kiosco',
      supplierId: 'sup-kio-massalin',
      costPrice: 800,
      salePrice: 1400,
      stock: 40,
      minStock: 10,
      unit: 'un',
      brand: 'Bic',
      updatedAt: new Date().toISOString()
    }
  ],

  'Farmacia / Perfumería': [
    {
      id: 'prod-far-1',
      code: '779900100001',
      name: 'Ibuprofeno 600mg Caja x10 Comprimidos',
      category: 'Medicamentos Venta Libre',
      supplierId: 'sup-1',
      costPrice: 1400,
      salePrice: 2300,
      stock: 35,
      minStock: 10,
      unit: 'caja',
      brand: 'Ibupirac / Actron',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-far-2',
      code: '779900100002',
      name: 'Crema Hidratante Facial 50ml',
      category: 'Dermocosmética',
      supplierId: 'sup-1',
      costPrice: 8500,
      salePrice: 13900,
      stock: 12,
      minStock: 4,
      unit: 'un',
      brand: 'Nivea / Dermaglós',
      updatedAt: new Date().toISOString()
    }
  ]
};

export function getCatalogForRubro(rubro: string): Product[] {
  if (!rubro) return RUBRO_CATALOGS['Comercio General / Multirrubro'];

  // Direct key lookup
  if (RUBRO_CATALOGS[rubro]) {
    return RUBRO_CATALOGS[rubro];
  }

  // Normalize string matching
  const key = Object.keys(RUBRO_CATALOGS).find(k => 
    rubro.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(rubro.toLowerCase())
  );
  if (key && RUBRO_CATALOGS[key]) {
    return RUBRO_CATALOGS[key];
  }

  // Specific keyword fallbacks
  const lower = rubro.toLowerCase();
  if (lower.includes('carniceria') || lower.includes('carnicería') || lower.includes('fiambre') || lower.includes('granja')) {
    return RUBRO_CATALOGS['Carnicería / Fiambrería & Granja'];
  }
  if (lower.includes('verduleria') || lower.includes('verdulería') || lower.includes('fruta') || lower.includes('frutería')) {
    return RUBRO_CATALOGS['Verdulería / Frutería'];
  }
  if (lower.includes('kiosco') || lower.includes('drugstore')) {
    return RUBRO_CATALOGS['Kiosco / Drugstore'];
  }
  if (lower.includes('farmacia') || lower.includes('perfumeria') || lower.includes('perfumería')) {
    return RUBRO_CATALOGS['Farmacia / Perfumería'];
  }
  if (lower.includes('indumentaria') || lower.includes('ropa') || lower.includes('calzado')) {
    return RUBRO_CATALOGS['Indumentaria / Calzado'];
  }
  if (lower.includes('supermercado') || lower.includes('almacen') || lower.includes('almacén')) {
    return RUBRO_CATALOGS['Supermercado / Almacén'];
  }
  if (lower.includes('ferreteria') || lower.includes('ferretería') || lower.includes('corralon') || lower.includes('corralón')) {
    return RUBRO_CATALOGS['Ferretería / Corralón'];
  }
  if (lower.includes('electronica') || lower.includes('electrónica') || lower.includes('computacion') || lower.includes('computación')) {
    return RUBRO_CATALOGS['Electrónica / Computación'];
  }
  if (lower.includes('gastronomia') || lower.includes('gastronomía') || lower.includes('panaderia') || lower.includes('panadería')) {
    return RUBRO_CATALOGS['Gastronomía / Panadería'];
  }
  if (lower.includes('autopartes') || lower.includes('repuestos') || lower.includes('taller')) {
    return RUBRO_CATALOGS['Autopartes / Repuestos'];
  }
  if (lower.includes('servicios') || lower.includes('profesional')) {
    return RUBRO_CATALOGS['Servicios / Profesional'];
  }

  return RUBRO_CATALOGS['Comercio General / Multirrubro'];
}
