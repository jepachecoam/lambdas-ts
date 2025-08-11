import axios from "axios";
export const prompt = (payload: any) => {
  return `
  Role: You are a backend expert developer specialized in data parsing. Your function is to convert data structures while preserving original values without alterations.

  Instructions:
  - You will generate a pure JavaScript function that converts the input to the specified schema
  - Map properties by name/semantic similarity (e.g.: "province" -> "state")
  - Handle missing fields with null value
  - The function MUST return the complete schema
  - You must return ONLY a pure JavaScript function without paraphrasing that returns an object with the output schema

  Output Schema Zod reference (copy exactly):
  const AddressSchema = z.object({
    country: z.string(),
    city: z.string(),
    address1: z.string(),
    address2: z.string().nullable().default(null),
    latitude: z.number().nullable().default(null),
    longitude: z.number().nullable().default(null),
    first_name: z.string().nullable().default(null),
    last_name: z.string().nullable().default(null),
    full_name: z.string(),
    phone: z.string(),
    state: z.string(),
    state_code: z.string().nullable().default(null)
  });

  export const ShopifyDataSchema = z.object({
    billing_address: AddressSchema,
    shipping_address: AddressSchema,
    customer: z.object({
      full_name: z.string(),
      first_name: z.string().nullable().default(null),
      last_name: z.string().nullable().default(null),
      phone: z.string().nullable().default(null),
      email: z.string().nullable().default(null),
      documentType: z.string().nullable().default(null),
      documentNumber: z.string().nullable().default(null)
    }),
    notes: z.array(z.string()).nullable().default([]),
    tags: z.array(z.string()).nullable().default([]),
    payment_method: z.string()
  });

  --- CRITICAL RULES ---
  1. NEVER modify values (e.g.: 123 → "123" or performing math operations is prohibited!)
  2. You must perform Semantic mapping (if field doesn't exist):
    - "province" → "state"
    - "name" → "full_name"
    - "province_code" → "state_code"
  3. All fields are 100% required, if you can't associate any field or information set null as default or [] for array type fields.
  4. Arrays: Convert comma-separated strings → arrays (e.g.: "a,b" → ["a","b"])

  --- TRANSFORMATION EXAMPLES ---
  Example 1: 
  Input: {"province": "Antioquia"} 
  Output: "state": "Antioquia"

  Example 2: 
  Input: {"address": "Calle 123"} 
  Output: "address1": "Calle 123"  // Semantic mapping

  --- FUNCTION REQUIREMENTS ---
  function dto(data){
    // Implementation must:
    // 1. Map all schema fields exactly
    // 2. Preserve original values without modification
    // 3. Handle semantic mappings only when exact matches missing
    // 4. Return complete schema structure
  }

  Complete example of Input object:
  {
      "billingAddressMatchesShippingAddress": true,
      "tags": [
          "some data"
      ],
      "paymentGatewayNames": [
          "some data"
      ],
      "note": "String",
      "customAttributes": [
          {
              "key": "Country code",
              "value": "some data"
          },
          {
              "key": "Nombre",
              "value": "some data"
          },
          {
              "key": "Apellido",
              "value": "some data"
          },
          {
              "key": "Teléfono",
              "value": "some data"
          },
          {
              "key": "Correo electrónico",
              "value": "some data"
          },
          {
              "key": "Dirección Especifica",
              "value": "some data"
          },
          {
              "key": "# de Casa o Apartamento",
              "value": "some data"
          },
          {
              "key": "Departamento",
              "value": "some data"
          },
          {
              "key": "Ciudad",
              "value": "some data"
          },
          {
              "key": "Punto de Referencia",
              "value": "some data"
          },
          {
              "key": "IP address",
              "value": "some data"
          }
      ],
      "billingAddress": {
          "city": "some data",
          "address1": "some data",
          "address2": "some data",
          "latitude": "some data",
          "longitude": "some data",
          "firstName": "some data",
          "lastName": "some data",
          "name": "some data",
          "phone": "some data",
          "country": "some data",
          "countryCode": "some data",
          "province": "some data",
          "provinceCode": "some data"
      },
      "shippingAddress": {
          "city": "some data",
          "address1": "some data",
          "address2": "some data",
          "latitude": "some data",
          "longitude": "some data",
          "firstName": "some data",
          "lastName": "some data",
          "name": "some data",
          "phone": "some data",
          "country": "some data",
          "countryCode": "some data",
          "province": "some data",
          "provinceCode": "some data"
      },
      "customer": {
          "email": "some data",
          "firstName": "some data",
          "lastName": "some data",
          "displayName": "some data",
          "multipassIdentifier": "some data",
          "note": "some data",
          "numberOfOrders": "some data",
          "phone": "some data",
          "productSubscriberStatus": "some data",
          "state": "some data",
          "tags": "some data",
          "validEmailAddress": "some data",
          "verifiedEmail": "some data",
          "addresses": [
              {
                  "name": "some data"
              },
              {
                  "name": "some data"
              }
          ]
      }
  }

  example of output:

  function dto(data){var a=function(k){if(!data.customAttributes)return null;for(var i=0;i<data.customAttributes.length;i++)if(data.customAttributes[i].key===k)return data.customAttributes[i].value;return null},b=function(){var f=data.billingAddress||{},s=data.shippingAddress||{},c=data.customer||{};return{billing_address:{country:f.country||null,city:f.city||null,address1:f.address1||null,address2:f.address2||null,latitude:f.latitude||null,longitude:f.longitude||null,first_name:f.firstName||null,last_name:f.lastName||null,full_name:f.name||null,phone:f.phone||null,state:f.province||null,state_code:f.provinceCode||null},shipping_address:{country:s.country||null,city:s.city||null,address1:s.address1||null,address2:s.address2||null,latitude:s.latitude||null,longitude:s.longitude||null,first_name:s.firstName||null,last_name:s.lastName||null,full_name:s.name||null,phone:s.phone||null,state:s.province||null,state_code:s.provinceCode||null},customer:{full_name:c.displayName||null,first_name:c.firstName||null,last_name:c.lastName||null,phone:c.phone||null,email:c.email||null,documentType:null,documentNumber:null},notes:data.note?[data.note]:[],tags:data.tags||[],payment_method:data.paymentGatewayNames?data.paymentGatewayNames[0]:null}}();return b.billing_address.first_name===null&&(b.billing_address.first_name=a("Nombre")),b.billing_address.last_name===null&&(b.billing_address.last_name=a("Apellido")),b.billing_address.full_name===null&&(b.billing_address.full_name=(a("Nombre")+" "+a("Apellido")).trim()||null),b.billing_address.phone===null&&(b.billing_address.phone=a("Teléfono")),b.billing_address.country===null&&(b.billing_address.country=a("Country code")),b.billing_address.city===null&&(b.billing_address.city=a("Ciudad")),b.billing_address.address1===null&&(b.billing_address.address1=a("Dirección Especifica")),b.billing_address.address2===null&&(b.billing_address.address2=a("# de Casa o Apartamento")),b.billing_address.state===null&&(b.billing_address.state=a("Departamento")),b.shipping_address.first_name===null&&(b.shipping_address.first_name=a("Nombre")),b.shipping_address.last_name===null&&(b.shipping_address.last_name=a("Apellido")),b.shipping_address.full_name===null&&(b.shipping_address.full_name=(a("Nombre")+" "+a("Apellido")).trim()||null),b.shipping_address.phone===null&&(b.shipping_address.phone=a("Teléfono")),b.shipping_address.country===null&&(b.shipping_address.country=a("Country code")),b.shipping_address.city===null&&(b.shipping_address.city=a("Ciudad")),b.shipping_address.address1===null&&(b.shipping_address.address1=a("Dirección Especifica")),b.shipping_address.address2===null&&(b.shipping_address.address2=a("# de Casa o Apartamento")),b.shipping_address.state===null&&(b.shipping_address.state=a("Departamento")),b.customer.first_name===null&&(b.customer.first_name=a("Nombre")),b.customer.last_name===null&&(b.customer.last_name=a("Apellido")),b.customer.full_name===null&&(b.customer.full_name=(a("Nombre")+" "+a("Apellido")).trim()||null),b.customer.phone===null&&(b.customer.phone=a("Teléfono")),b.customer.email===null&&(b.customer.email=a("Correo electrónico")),b}

  Object to parse aca debajo ↓:
  """
  ${JSON.stringify(payload)}
  """

  Critical Context:
  - This function will be executed using eval() in production
  - Output MUST be a single-line function without comments or line breaks
  - Only return the function code - no additional text or explanations

  --- RESPONSE FORMAT ---
  function dto(data){
  ...implementation
  }

  Do not enclose your response in any formatting or add paraphrasing. Respond strictly and exclusively with your answer.
  `;
};

export const cleanHtmlEscapedContent = (htmlEscapedString: string) => {
  const cleaned = htmlEscapedString
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  const codeBlockRegex = /```[\w]*\s*([\s\S]*?)```/;
  const match = cleaned.match(codeBlockRegex);

  if (match && match[1]) {
    console.log("🧹 [CLEAN] Función extraída de bloque de código");
    return match[1].trim();
  }

  return cleaned;
};

export const parseJsonIfNeeded = (content: string) => {
  try {
    const parsedContent = JSON.parse(content);
    return typeof parsedContent === "string" ? parsedContent : content;
  } catch {
    return content;
  }
};

export const sendSlackAlert = (payload: {
  logStreamId: string;
  message: string;
  data: any;
}) => {
  return axios.post(
    process.env["SLACK_URL_NOTIFICATION"]!,
    {
      logStreamId: payload.logStreamId,
      message: payload.message,
      data: JSON.stringify(payload.data)
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
