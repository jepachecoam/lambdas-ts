import Fuse from "fuse.js";

import { OrderSchemaExpected } from "./schema";
import {
  IFallbackData,
  IShopifyAddress,
  IShopifyCustomAttribute,
  IShopifyCustomer,
  IShopifyOrder
} from "./types";

const validateEvent = (event: any): boolean => {
  if (!event.id || !event.data) {
    return false;
  } else {
    return true;
  }
};

const getParams = (event: any) => {
  const shopifyOrderId = event.pathParameters?.shopifyOrderId;
  const shopifyAccessToken = event.headers?.["x-shopify-access-token"];
  const body = JSON.parse(event.body);
  const shopifyStoreUrl = body["X-Shopify-Url-Store"];
  const msApiKey = body.msApiKey;
  const configTool = {
    idUser: body.configTool?.idUser,
    idConfTool: body.configTool?.idConfTool
  };
  return {
    shopifyAccessToken,
    shopifyStoreUrl,
    shopifyOrderId,
    environment: event.requestContext?.stage ?? "dev",
    msApiKey,
    configTool
  };
};

const normalizeOrderData = (order: IShopifyOrder) => {
  const billing = order?.billingAddress;
  const shipping = order?.shippingAddress;
  const addressesMatch = order?.billingAddressMatchesShippingAddress;
  const customer = order?.customer;
  const tags = order?.tags;
  const customAttributes = extractFromCustomAttributes(order?.customAttributes);
  const note = order?.note;
  const totalDiscounts = order?.totalDiscounts;
  const totalPrice = order?.totalPrice;
  const lineItems = order?.lineItems;
  const totalShippingPriceSet = order?.totalShippingPriceSet;

  const { billingAddr, shippingAddr } = normalizeAddresses(
    billing,
    shipping,
    addressesMatch
  );

  const fallbackData = createFallbackData(
    billing,
    shipping,
    customer,
    customAttributes
  );

  const { address: billingAddress, usedFallback: billingUsedFallback } =
    createAddressWithFallbackTracking(billingAddr, fallbackData);

  const { address: shippingAddress, usedFallback: shippingUsedFallback } =
    createAddressWithFallbackTracking(shippingAddr, fallbackData);

  const { customer: normalizedCustomer, usedFallback: customerUsedFallback } =
    createCustomerWithFallbackTracking(customer, fallbackData);

  const paymentMethod = createPaymentMethod(order?.paymentGatewayNames);

  return {
    usedFallback:
      billingUsedFallback || shippingUsedFallback || customerUsedFallback,
    data: {
      billingAddress: billingAddress,
      shippingAddress: shippingAddress,
      customer: normalizedCustomer,
      tags,
      paymentMethod: paymentMethod,
      note,
      totalDiscounts,
      totalPrice,
      lineItems,
      documentType: fallbackData.documentType,
      documentNumber: fallbackData.documentNumber,
      totalShippingPriceSet
    }
  };
};

const normalizeAddresses = (
  billing: any,
  shipping: any,
  addressesMatch: boolean
) => {
  if (addressesMatch) {
    const addr = billing || shipping;
    return { billingAddr: addr, shippingAddr: addr };
  }
  return { billingAddr: billing, shippingAddr: shipping };
};

const createPaymentMethod = (paymentMethod: any) => {
  if (!paymentMethod) return null;
  if (Array.isArray(paymentMethod)) {
    paymentMethod = paymentMethod[0];
  }

  if (typeof paymentMethod === "string") {
    const codOptions = [
      "cod",
      "cash on delivery cod",
      "contraentrega",
      "contra entrega",
      "pago contra entrega",
      "cash on delivery",
      "efectivo contra entrega",
      "pago al recibir",
      "pago en destino",
      "collect on delivery",
      "cash on delivery (cod)"
    ];

    const fuse = new Fuse(codOptions, {
      isCaseSensitive: false,
      threshold: 0.15,
      includeScore: true
    });

    const searchResult = fuse.search(paymentMethod.toLowerCase());

    if (
      (searchResult.length > 0 && searchResult[0].score! <= 0.15) ||
      paymentMethod.toLocaleLowerCase().includes("cod")
    ) {
      return "cod";
    }
  }

  return paymentMethod;
};

const createFallbackData = (
  billing: any,
  shipping: any,
  customer: any,
  ca: IFallbackData | null
): IFallbackData => {
  const country = shipping?.country || billing?.country || ca?.country || null;

  const city = shipping?.city || billing?.city || ca?.city || null;

  const address =
    shipping?.address1 ||
    billing?.address1 ||
    ca?.address ||
    shipping?.address2 ||
    billing?.address2 ||
    null;

  const latitude =
    shipping?.latitude || billing?.latitude || ca?.latitude || null;

  const longitude =
    shipping?.longitude || billing?.longitude || ca?.longitude || null;

  const firstName =
    shipping?.firstName ||
    billing?.firstName ||
    customer?.firstName ||
    ca?.firstName ||
    null;

  const lastName =
    shipping?.lastName ||
    billing?.lastName ||
    customer?.lastName ||
    ca?.lastName ||
    null;

  const fullName =
    shipping?.name ||
    billing?.name ||
    customer?.displayName ||
    ca?.fullName ||
    firstName ||
    null;

  const phone =
    shipping?.phone || billing?.phone || customer?.phone || ca?.phone || null;

  const email =
    shipping?.email || billing?.email || customer?.email || ca?.email || null;

  const state = shipping?.province || billing?.province || ca?.state || null;

  const stateCode =
    shipping?.provinceCode || billing?.provinceCode || ca?.stateCode || null;

  const documentType = ca?.documentType || null;

  const documentNumber = ca?.documentNumber || null;

  return {
    documentNumber,
    documentType,
    country,
    city,
    address,
    latitude,
    longitude,
    firstName,
    lastName,
    fullName,
    phone,
    email,
    state,
    stateCode
  };
};

const createAddressWithFallbackTracking = (
  addr: any,
  fallback: any
): {
  address: IShopifyAddress;
  usedFallback: boolean;
} => {
  let usedFallback = false;

  let country = addr?.country;
  if (!country && fallback.country) {
    country = fallback.country;
    usedFallback = true;
  }

  let city = addr?.city;
  if (!city && fallback.city) {
    city = fallback.city;
    usedFallback = true;
  }

  let address1 = addr?.address1;
  if (!address1 && fallback.address) {
    address1 = fallback.address;
    usedFallback = true;
  }

  let latitude = addr?.latitude;
  if (!latitude && fallback.latitude) {
    latitude = fallback.latitude;
    usedFallback = true;
  }

  let longitude = addr?.longitude;
  if (!longitude && fallback.longitude) {
    longitude = fallback.longitude;
    usedFallback = true;
  }

  let firstName = addr?.firstName;
  if (!firstName && fallback.firstName) {
    firstName = fallback.firstName;
    usedFallback = true;
  }

  let lastName = addr?.lastName;
  if (!lastName && fallback.lastName) {
    lastName = fallback.lastName;
    usedFallback = true;
  }

  let fullName = addr?.name;
  if (!fullName && fallback.fullName) {
    fullName = fallback.fullName;
    usedFallback = true;
  }

  let phone = addr?.phone;
  if (!phone && fallback.phone) {
    phone = fallback.phone;
    usedFallback = true;
  }

  let state = addr?.province;
  if (!state && fallback.state) {
    state = fallback.state;
    usedFallback = true;
  }

  let stateCode = addr?.provinceCode;
  if (!stateCode && fallback.stateCode) {
    stateCode = fallback.stateCode;
    usedFallback = true;
  }

  const address: IShopifyAddress = {
    country: country || null,
    city: city || null,
    address1: address1 || null,
    address2: addr?.address2 || null,
    latitude: latitude || null,
    longitude: longitude || null,
    firstName: firstName || null,
    name: fullName || null,
    lastName: lastName || null,
    phone: phone || null,
    province: state || null,
    provinceCode: stateCode || null,
    countryCode: addr?.countryCode || null
  };

  return { address, usedFallback };
};

const createCustomerWithFallbackTracking = (
  customer: any,
  fallback: IFallbackData
): {
  customer: IShopifyCustomer;
  usedFallback: boolean;
} => {
  let usedFallback = false;

  let fullName = customer?.displayName;
  if (!fullName && fallback.fullName) {
    fullName = fallback.fullName;
    usedFallback = true;
  }

  let firstName = customer?.firstName;
  if (!firstName && fallback.firstName) {
    firstName = fallback.firstName;
    usedFallback = true;
  }

  let lastName = customer?.lastName;
  if (!lastName && fallback.lastName) {
    lastName = fallback.lastName;
    usedFallback = true;
  }

  let phone = customer?.phone;
  if (!phone && fallback.phone) {
    phone = fallback.phone;
    usedFallback = true;
  }

  let email = customer?.email;
  if (!email && fallback.email) {
    email = fallback.email;
    usedFallback = true;
  }

  const customerData: IShopifyCustomer = {
    displayName: fullName || null,
    firstName: firstName || null,
    lastName: lastName || null,
    phone: phone || null,
    email: email || null
  };

  return { customer: customerData, usedFallback };
};

const extractFromCustomAttributes = (
  customAttributes: IShopifyCustomAttribute[] | null | undefined
): IFallbackData => {
  const result: IFallbackData = {
    country: null,
    city: null,
    address: null,
    latitude: null,
    longitude: null,
    firstName: null,
    lastName: null,
    fullName: null,
    phone: null,
    email: null,
    state: null,
    stateCode: null,
    documentType: null,
    documentNumber: null
  };
  if (
    !customAttributes ||
    !Array.isArray(customAttributes) ||
    customAttributes.length === 0
  ) {
    return result;
  }

  const keyMappings = {
    country: [
      "country",
      "country code",
      "pais",
      "codigo pais",
      "país",
      "código país",
      "country_code",
      "pais_codigo",
      "countrycode",
      "paiscodigo"
    ],
    city: [
      "city",
      "ciudad",
      "localidad",
      "municipio",
      "poblacion",
      "población",
      "town",
      "locality",
      "municipality"
    ],
    address: [
      "address",
      "direccion",
      "dirección",
      "calle",
      "street",
      "address1",
      "address_1",
      "direccion_1",
      "dirección_1",
      "calle, numero y barrio",
      "dirección de referencia",
      "direccion de referencia",
      "domicilio",
      "residencia",
      "ubicacion",
      "ubicación"
    ],
    latitude: [
      "latitude",
      "lat",
      "latitud",
      "coordenada_lat",
      "coord_lat",
      "geo_lat",
      "gps_lat",
      "position_lat"
    ],
    longitude: [
      "longitude",
      "lng",
      "lon",
      "longitud",
      "coordenada_lng",
      "coord_lng",
      "geo_lng",
      "gps_lng",
      "position_lng",
      "coordenada_lon",
      "coord_lon"
    ],
    fullName: [
      "full name",
      "full_name",
      "fullname",
      "nombre completo",
      "nombre_completo",
      "complete name",
      "complete_name",
      "display name",
      "display_name",
      "customer name",
      "customer_name"
    ],
    firstName: [
      "nombre",
      "nombres",
      "first name",
      "first_name",
      "firstname",
      "primer nombre",
      "primer_nombre",
      "given name",
      "given_name"
    ],
    lastName: [
      "last name",
      "last_name",
      "lastname",
      "apellido",
      "apellidos",
      "surname",
      "family name",
      "family_name",
      "segundo apellido"
    ],
    phone: [
      "phone",
      "telefono",
      "teléfono",
      "tel",
      "mobile",
      "movil",
      "móvil",
      "whatsapp",
      "whatsapp principal",
      "whatsapp_principal",
      "celular",
      "cell",
      "phone number",
      "phone_number",
      "numero telefono",
      "número teléfono",
      "contact",
      "contacto"
    ],
    email: [
      "email",
      "e-mail",
      "correo",
      "correo electronico",
      "correo electrónico",
      "correo_electronico",
      "mail",
      "electronic mail",
      "contact email",
      "contact_email",
      "email address",
      "email_address"
    ],
    state: [
      "state",
      "provincia",
      "estado",
      "region",
      "región",
      "department",
      "departamento",
      "county",
      "condado",
      "administrative area"
    ],
    stateCode: [
      "state code",
      "state_code",
      "codigo provincia",
      "código provincia",
      "codigo_provincia",
      "código_provincia",
      "codigo estado",
      "código estado",
      "codigo_estado",
      "código_estado",
      "province code",
      "province_code"
    ],
    documentType: [
      "document type",
      "document_type",
      "tipo documento",
      "tipo de documento",
      "tipo_documento",
      "tipo_de_documento",
      "id type",
      "id_type",
      "identification type",
      "identification_type"
    ],
    documentNumber: [
      "document number",
      "document_number",
      "numero documento",
      "número documento",
      "numero_documento",
      "número_documento",
      "numero de documento",
      "número de documento",
      "id number",
      "id_number",
      "identification number",
      "identification_number",
      "cedula",
      "cédula",
      "dni",
      "nit",
      "cc",
      "ti",
      "ce"
    ]
  };

  const fuseOptions = {
    threshold: 0.15,
    includeScore: true
  };

  const fuseInstances = Object.fromEntries(
    Object.entries(keyMappings).map(([field, possibleKeys]) => [
      field,
      new Fuse(possibleKeys, fuseOptions)
    ])
  );

  for (const attr of customAttributes) {
    if (
      !attr ||
      typeof attr.key !== "string" ||
      typeof attr.value !== "string"
    ) {
      continue;
    }

    for (const [field, fuse] of Object.entries(fuseInstances)) {
      if ((result as any)[field] !== null) continue;

      const searchResult = fuse.search(attr.key.toLowerCase());

      if (searchResult.length > 0 && searchResult[0].score! <= 0.15) {
        (result as any)[field] = attr.value || null;
        break;
      }
    }
  }

  return result;
};

export function convertToOrderSchemaExpected(input: any): {
  orderSchemaExpected: OrderSchemaExpected;
  usedDefaultValuesInCriticalFields: boolean;
} {
  const shippingAddress = input.shippingAddress;
  const billingAddress = input.billingAddress;
  let usedDefaultValuesInCriticalFields = false;

  const checkCritical = (value: any) => {
    if (!value) {
      usedDefaultValuesInCriticalFields = true;
      return "Sin datos";
    }
    return value;
  };

  const line_items =
    input.lineItems?.edges?.map((edge: any) => {
      const node = edge.node;
      const variant = node.variant;
      const productId = parseInt(node.product.id.split("/").pop() || "0");
      const variantId = parseInt(variant.id.split("/").pop() || "0");

      return {
        name: node.title,
        current_quantity: node.quantity,
        grams: variant.inventoryItem?.measurement?.weight?.value || 0,
        price: parseFloat(variant.price),
        title: node.title,
        product_id: productId,
        variant_id: variantId,
        discount_allocations: node.discountAllocations
      };
    }) || [];

  const totalShippingPriceSet = input?.totalShippingPriceSet?.shopMoney?.amount;

  const orderSchemaExpected: OrderSchemaExpected = {
    total_shipping_price_set: Number(totalShippingPriceSet) || 0,
    billing_address: {
      country: checkCritical(billingAddress.country),
      city: checkCritical(billingAddress.city),
      address1: checkCritical(billingAddress.address1),
      address2: billingAddress.address2 || "Sin datos",
      latitude: billingAddress.latitude || 0,
      longitude: billingAddress.longitude || 0,
      first_name: billingAddress.firstName || "Sin datos",
      last_name: billingAddress.lastName || "Sin datos",
      full_name: checkCritical(billingAddress.name),
      phone: checkCritical(billingAddress.phone),
      state: checkCritical(billingAddress.province),
      state_code: billingAddress.provinceCode || "Sin datos"
    },
    shipping_address: {
      country: checkCritical(shippingAddress.country),
      city: checkCritical(shippingAddress.city),
      address1: checkCritical(shippingAddress.address1),
      address2: shippingAddress.address2 || "Sin datos",
      latitude: shippingAddress.latitude || 0,
      longitude: shippingAddress.longitude || 0,
      first_name: shippingAddress.firstName || "Sin datos",
      last_name: shippingAddress.lastName || "Sin datos",
      full_name: checkCritical(shippingAddress.name),
      phone: checkCritical(shippingAddress.phone),
      state: checkCritical(shippingAddress.province),
      state_code: shippingAddress.provinceCode || "Sin datos"
    },
    customer: {
      full_name: checkCritical(input.customer.displayName),
      first_name: input.customer.firstName || "Sin datos",
      last_name: input.customer.lastName || "Sin datos",
      phone: input.customer.phone || "Sin datos",
      email: input.customer.email || "Sin datos",
      documentType: input.documentType || "Sin datos",
      documentNumber: input.documentNumber || "Sin datos"
    },
    notes: input.note ? [input.note] : ["Shopify Order"],
    tags: input.tags || [],
    payment_method: checkCritical(input.paymentMethod),
    line_items,
    total_discounts: input?.totalDiscounts?.toString(),
    total_price: input?.totalPrice?.toString()
  };

  return {
    orderSchemaExpected,
    usedDefaultValuesInCriticalFields
  };
}

const buildNormalizeProductsBody = (directResult: any, configTool: any) => {
  const result = {
    data: {
      destination: "mastershop",
      additionalData: {
        discountAmount: directResult?.order?.total_discounts,
        shippingAmount: directResult?.order?.total_shipping_price_set
      },
      origin: "shopify",
      products: directResult?.order?.line_items
    },
    configTool
  };

  return result;
};

const buildProcessOrderBody = (
  directResult: any,
  normalizeProductsResp: any,
  shopifyOrderId: string
) => {
  const alerts = [];

  if (directResult.usedDefaultValuesInCriticalFields) {
    alerts.push(67);
  }

  if (directResult.usedFallback) {
    alerts.push(68);
  }

  const order = directResult.order;

  const result = {
    additional_charge: normalizeProductsResp.additional_charge || [],
    notes: order.notes || [],
    alerts: alerts,
    test: "false",
    origin_address: {
      zip: "0000",
      country: "CO",
      city: order.billing_address?.city || null,
      address2: order.billing_address?.address2 || null,
      address1: order.billing_address?.address1 || null,
      latitude: order.billing_address?.latitude || null,
      last_name: order.billing_address?.last_name || null,
      country_code: "CO",
      full_name: order.billing_address?.full_name || null,
      phone: order.billing_address?.phone || null,
      company: null,
      state: order.billing_address?.state || null,
      state_code: order.billing_address?.state_code || null,
      first_name: order.billing_address?.first_name || null,
      longitude: order.billing_address?.longitude || null
    },
    shipping_address: {
      zip: "0000",
      country: "CO",
      city: order.shipping_address?.city || null,
      address2: order.shipping_address?.address2 || null,
      address1: order.shipping_address?.address1 || null,
      latitude: order.shipping_address?.latitude || null,
      last_name: order.shipping_address?.last_name || null,
      country_code: "CO",
      full_name: order.shipping_address?.full_name || null,
      phone: order.shipping_address?.phone || null,
      company: null,
      state: order.shipping_address?.state || null,
      state_code: order.shipping_address?.state_code || null,
      first_name: order.shipping_address?.first_name || null,
      longitude: order.shipping_address?.longitude || null
    },
    billing_address: {
      zip: "0000",
      country: "CO",
      city: order.billing_address?.city || null,
      address2: order.billing_address?.address2 || null,
      address1: order.billing_address?.address1 || null,
      latitude: order.billing_address?.latitude || null,
      last_name: order.billing_address?.last_name || null,
      country_code: "CO",
      full_name: order.billing_address?.full_name || null,
      phone: order.billing_address?.phone || null,
      company: null,
      state: order.billing_address?.state || null,
      state_code: order.billing_address?.state_code || null,
      first_name: order.billing_address?.first_name || null,
      longitude: order.billing_address?.longitude || null
    },
    tags: order.tags || [],
    id_order: shopifyOrderId,
    order_transaction: {
      total: parseFloat(order.total_price || "0"),
      currency: "COP",
      payment_method: order.payment_method || "COD"
    },
    date_created_order: new Date().toISOString(),
    order_package: normalizeProductsResp.order_package || { weight: 1 },
    status: "Por Confirmar",
    customer: {
      full_name: order.customer?.full_name || null,
      phone: order.customer?.phone || null,
      documentType: order.customer?.documentType || null,
      documentNumber: order.customer?.documentNumber || null,
      last_name: order.customer?.last_name || null,
      first_name: order.customer?.first_name || null,
      email: order.customer?.email || null
    },
    order_items: normalizeProductsResp.order_items || []
  };

  return result;
};

export default {
  convertToOrderSchemaExpected,
  validateEvent,
  getParams,
  normalizeOrderData,
  buildNormalizeProductsBody,
  buildProcessOrderBody
};
