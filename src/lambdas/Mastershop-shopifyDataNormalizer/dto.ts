import Fuse from "fuse.js";

import { OrderSchemaExpected } from "./schema";
import {
  Address,
  CustomAttribute,
  Customer,
  ExtractedData,
  NormalizedOrderOutput,
  ShopifyOrder
} from "./types";

const validateEvent = (event: any): boolean => {
  if (!event.id || !event.data) {
    return false;
  } else {
    return true;
  }
};

const getParams = (event: any) => {
  return {
    shopifyAccessToken: event.headers?.["x-shopify-access-token"],
    shopifyStoreUrl: event.queryStringParameters?.["X-Shopify-Url-Store"],
    shopifyOrderId: event.pathParameters?.shopifyOrderId,
    environment: event.requestContext?.stage ?? "dev"
  };
};

const normalizeOrderData = (order: ShopifyOrder) => {
  const billing = order?.billingAddress;
  const shipping = order?.shippingAddress;
  const addressesMatch = order?.billingAddressMatchesShippingAddress;
  const customer = order?.customer;
  const tags = order?.tags;
  const customAttributes = extractFromCustomAttributes(order?.customAttributes);

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
    createCustomerWithFallbackTracking(
      customer,
      customAttributes,
      fallbackData
    );

  const paymentMethod = createPaymentMethod(order?.paymentGatewayNames);

  const normalizedOrder: NormalizedOrderOutput = {
    billingAddress: billingAddress,
    shippingAddress: shippingAddress,
    customer: normalizedCustomer,
    notes: [],
    tags,
    paymentMethod: paymentMethod
  };

  return {
    usedFallback:
      billingUsedFallback || shippingUsedFallback || customerUsedFallback,
    data: normalizedOrder
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
  ca: ExtractedData | null
) => {
  return {
    country: shipping?.country || billing?.country || ca?.country || null,
    city: shipping?.city || billing?.city || ca?.city || null,
    address: shipping?.address1 || billing?.address1 || ca?.address || null,
    latitude: shipping?.latitude || billing?.latitude || ca?.latitude || null,
    longitude:
      shipping?.longitude || billing?.longitude || ca?.longitude || null,
    firstName:
      shipping?.firstName ||
      billing?.firstName ||
      customer?.firstName ||
      ca?.firstName ||
      null,
    lastName:
      shipping?.lastName ||
      billing?.lastName ||
      customer?.lastName ||
      ca?.lastName ||
      null,
    fullName:
      shipping?.name ||
      billing?.name ||
      customer?.displayName ||
      ca?.fullName ||
      null,
    phone:
      shipping?.phone || billing?.phone || customer?.phone || ca?.phone || null,
    email:
      shipping?.email || billing?.email || customer?.email || ca?.email || null,
    state: shipping?.province || billing?.province || ca?.state || null,
    stateCode:
      shipping?.provinceCode || billing?.provinceCode || ca?.stateCode || null
  };
};

const createAddressWithFallbackTracking = (addr: any, fallback: any) => {
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

  const address: Address = {
    zip: addr?.zip || null,
    country: country || null,
    city: city || null,
    address1: address1 || null,
    address2: addr?.address2 || null,
    latitude: latitude || null,
    longitude: longitude || null,
    firstName: firstName || null,
    lastName: lastName || null,
    fullName: fullName || null,
    phone: phone || null,
    company: addr?.company || null,
    state: state || null,
    stateCode: stateCode || null,
    countryCode: addr?.countryCode || null
  };

  return { address, usedFallback };
};

const createCustomerWithFallbackTracking = (
  customer: any,
  ca: ExtractedData | null,
  fallback: any
) => {
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

  const customerData: Customer = {
    fullName: fullName || null,
    firstName: firstName || null,
    lastName: lastName || null,
    phone: phone || null,
    email: email || null,
    documentType: ca?.documentType || null,
    documentNumber: ca?.documentNumber || null
  };

  return { customer: customerData, usedFallback };
};

const extractFromCustomAttributes = (
  customAttributes: CustomAttribute[] | null | undefined
): ExtractedData | null => {
  const result: ExtractedData = {
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
    return null;
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

export function convertToOrderSchemaExpected(input: NormalizedOrderOutput): {
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

  const orderSchemaExpected = {
    billing_address: {
      country: checkCritical(billingAddress.country),
      city: checkCritical(billingAddress.city),
      address1: checkCritical(billingAddress.address1),
      address2: billingAddress.address2 || "Sin datos",
      latitude: billingAddress.latitude || 0,
      longitude: billingAddress.longitude || 0,
      first_name: billingAddress.firstName || "Sin datos",
      last_name: billingAddress.lastName || "Sin datos",
      full_name: checkCritical(billingAddress.fullName),
      phone: checkCritical(billingAddress.phone),
      state: checkCritical(billingAddress.state),
      state_code: billingAddress.stateCode || "Sin datos"
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
      full_name: checkCritical(shippingAddress.fullName),
      phone: checkCritical(shippingAddress.phone),
      state: checkCritical(shippingAddress.state),
      state_code: shippingAddress.stateCode || "Sin datos"
    },
    customer: {
      full_name: checkCritical(input.customer.fullName),
      first_name: input.customer.firstName || "Sin datos",
      last_name: input.customer.lastName || "Sin datos",
      phone: input.customer.phone || "Sin datos",
      email: input.customer.email || "Sin datos",
      documentType: input.customer.documentType || "Sin datos",
      documentNumber: input.customer.documentNumber || "Sin datos"
    },
    notes: input.notes || [],
    tags: input.tags || [],
    payment_method: checkCritical(input.paymentMethod)
  };

  return {
    orderSchemaExpected,
    usedDefaultValuesInCriticalFields
  };
}

export default {
  convertToOrderSchemaExpected,
  validateEvent,
  getParams,
  normalizeOrderData
};
