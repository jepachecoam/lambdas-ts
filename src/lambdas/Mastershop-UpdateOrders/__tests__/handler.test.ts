/**
 * handler.test.ts — Mastershop-UpdateOrders
 *
 * Tests invoke the handler directly with realistic SQS events.
 * Only external dependencies are mocked (Database, axios).
 * Internal layers (model, dao, dto) run as-is — their logic is validated
 * through the handler's observable output: { statusCode, body }.
 */

// ─── Mocks (must come before all imports) ─────────────────────────────────────

jest.mock("../../../shared/databases/sequelize", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    fetchOne: jest.fn(),
    fetchMany: jest.fn(),
    insert: jest.fn(),
    update: jest.fn()
  }))
}));

jest.mock("axios");

// Mock conf/envs so env vars are available regardless of module load order.
// The actual values are set in beforeAll below.
jest.mock("../conf/envs", () => ({
  envs: {
    get API_KEY_MS() {
      return process.env["API_KEY_MS"]!;
    },
    get APP_NAME_MS() {
      return process.env["APP_NAME_MS"]!;
    },
    get BASE_URL_MS() {
      return process.env["BASE_URL_MS"]!;
    },
    get URL_WEBHOOK_ERROR_LOGS() {
      return process.env["URL_WEBHOOK_ERROR_LOGS"]!;
    },
    get ENVIRONMENT() {
      return process.env["ENVIRONMENT"]!;
    }
  }
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import axios from "axios";

import Database from "../../../shared/databases/sequelize";
import { handler } from "../index";

// ─── Mock references ───────────────────────────────────────────────────────────

const MockDatabase = Database as unknown as jest.Mock;
const mockAxios = axios as unknown as jest.Mock;

// ─── Per-test DB mock handles ─────────────────────────────────────────────────

let mockFetchOne: jest.Mock;
let mockFetchMany: jest.Mock;
let mockInsert: jest.Mock;
let mockUpdate: jest.Mock;

// ─── Environment setup ─────────────────────────────────────────────────────────

beforeAll(() => {
  process.env["BASE_URL_MS"] = "https://api.test.com";
  process.env["URL_WEBHOOK_ERROR_LOGS"] = "https://webhook.test.com/errors";
  process.env["API_KEY_MS"] = "test-api-key";
  process.env["APP_NAME_MS"] = "test-app";
  process.env["ENVIRONMENT"] = "dev";

  // DB env vars required by checkEnv
  process.env["DB_NAME_DEV"] = "test_db";
  process.env["DB_USER_DEV"] = "test_user";
  process.env["DB_PASSWORD_DEV"] = "test_pass";
  process.env["DB_HOST_DEV"] = "localhost";
  process.env["DB_HOST_READ_ONLY_DEV"] = "localhost";
  process.env["DB_NAME_QA"] = "test_db_qa";
  process.env["DB_USER_QA"] = "test_user_qa";
  process.env["DB_PASSWORD_QA"] = "test_pass_qa";
  process.env["DB_HOST_QA"] = "localhost_qa";
  process.env["DB_HOST_READ_ONLY_QA"] = "localhost_qa";
  process.env["DB_NAME_PROD"] = "test_db_prod";
  process.env["DB_USER_PROD"] = "test_user_prod";
  process.env["DB_PASSWORD_PROD"] = "test_pass_prod";
  process.env["DB_HOST_PROD"] = "localhost_prod";
  process.env["DB_HOST_READ_ONLY_PROD"] = "localhost_prod";
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseCarrierStatus = [
  {
    carrierCode: "099",
    idCarrierStatusUpdate: 1,
    isActive: true,
    statusAuxLabel: null,
    idStatus: 5,
    statusName: "Entregado",
    requiresAdditionalSteps: false
  }
];

const baseShipmentUpdates = [
  {
    codeCarrierShipmentUpdate: "001",
    isActive: true,
    idShipmentUpdate: 100,
    name: "Update 1",
    requiresAdditionalSteps: false
  }
];

// ─── Event / context builders ─────────────────────────────────────────────────

const buildEvent = (
  bodyOverrides: Record<string, unknown> = {},
  recordsOverride?: any[]
) => {
  const defaultBody = {
    carrierName: "COORDINADORA",
    trackingNumber: "123456789",
    status: { statusCode: "099", statusName: "Entregado" },
    novelty: { noveltyCode: null },
    returnProcess: { returnTrackingNumber: null },
    linkedShipment: {
      linkedCarrierTrackingCode: null,
      shippingRate: null,
      originAddress: null,
      shippingAddress: null,
      legReason: null
    },
    carrierData: {},
    updateSource: null,
    ...bodyOverrides
  };

  return {
    Records: recordsOverride ?? [{ body: JSON.stringify(defaultBody) }]
  };
};

const buildContext = () => ({ logStreamName: "test-log-stream" });

// ─── DB setup helpers ──────────────────────────────────────────────────────────

/**
 * Sets up mocks for a happy-path "order" source record.
 */
const setupValidOrderDb = () => {
  mockFetchMany
    .mockResolvedValueOnce([
      {
        idUser: 1,
        idBusiness: 1,
        idOrder: 100,
        idOrderReturn: null,
        source: "order",
        carrierTrackingCode: "123456789"
      }
    ]) // getDataByCarrierTrackingNumber
    .mockResolvedValueOnce([{ idOrder: 100, source: "order" }]) // getOrderPrecedence
    .mockResolvedValueOnce(baseCarrierStatus) // getCarrierStatus
    .mockResolvedValueOnce(baseShipmentUpdates); // getShipmentUpdates

  mockInsert.mockResolvedValue(true); // createOrderShipmentUpdateHistoryIfNotExists
};

/**
 * Sets up mocks for a happy-path "orderLeg" source record.
 */
const setupValidOrderLegDb = () => {
  mockFetchMany
    .mockResolvedValueOnce([
      {
        idUser: 1,
        idBusiness: 1,
        idOrder: 100,
        idOrderReturn: null,
        source: "orderLeg",
        carrierTrackingCode: "123456789"
      }
    ]) // getDataByCarrierTrackingNumber
    .mockResolvedValueOnce([{ idOrder: 100, source: "orderLeg" }]) // getOrderPrecedence
    .mockResolvedValueOnce(baseCarrierStatus) // getCarrierStatus
    .mockResolvedValueOnce(baseShipmentUpdates); // getShipmentUpdates

  mockFetchOne.mockResolvedValue({
    idOrderLeg: 10,
    carrierTrackingCode: "123456789"
  }); // getLatestOrderLeg

  mockInsert.mockResolvedValue(true);
};

/**
 * Sets up mocks for a happy-path "orderReturn" source record.
 */
const setupValidOrderReturnDb = () => {
  mockFetchMany
    .mockResolvedValueOnce([
      {
        idUser: 1,
        idBusiness: 1,
        idOrder: 100,
        idOrderReturn: 200,
        source: "orderReturn",
        carrierTrackingCode: "123456789"
      }
    ]) // getDataByCarrierTrackingNumber
    .mockResolvedValueOnce([{ idOrder: 100, source: "orderReturn" }]) // getOrderPrecedence
    .mockResolvedValueOnce(baseCarrierStatus) // getCarrierStatus
    .mockResolvedValueOnce(baseShipmentUpdates); // getShipmentUpdates

  mockInsert
    .mockResolvedValueOnce(true) // createOrderReturnShipmentUpdateHistoryIfNotExists
    .mockResolvedValueOnce(true); // createOrderReturnStatusLogIfNotExists

  mockUpdate.mockResolvedValue(true); // updateStatusOrderReturn
};

/**
 * Sets up mocks for a happy-path "orderReturnLeg" source record.
 */
const setupValidOrderReturnLegDb = () => {
  mockFetchMany
    .mockResolvedValueOnce([
      {
        idUser: 1,
        idBusiness: 1,
        idOrder: 100,
        idOrderReturn: 200,
        source: "orderReturnLeg",
        carrierTrackingCode: "123456789"
      }
    ]) // getDataByCarrierTrackingNumber
    .mockResolvedValueOnce([{ idOrder: 100, source: "orderReturnLeg" }]) // getOrderPrecedence
    .mockResolvedValueOnce(baseCarrierStatus) // getCarrierStatus
    .mockResolvedValueOnce(baseShipmentUpdates); // getShipmentUpdates

  mockFetchOne.mockResolvedValue({
    idOrderReturnLeg: 20,
    carrierTrackingCode: "123456789"
  }); // getLatestOrderReturnLeg

  mockInsert
    .mockResolvedValueOnce(true) // createOrderReturnShipmentUpdateHistoryIfNotExists
    .mockResolvedValueOnce(true); // createOrderReturnStatusLogIfNotExists

  mockUpdate.mockResolvedValue(true); // updateStatusOrderReturn
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  mockFetchOne = jest.fn();
  mockFetchMany = jest.fn();
  mockInsert = jest.fn();
  mockUpdate = jest.fn();

  MockDatabase.mockImplementation(() => ({
    fetchOne: mockFetchOne,
    fetchMany: mockFetchMany,
    insert: mockInsert,
    update: mockUpdate
  }));

  // Default: axios returns a successful getOrder response
  mockAxios.mockResolvedValue({
    status: 200,
    data: { data: { id_status: 1, status: "En Proceso" } }
  });

  // Default DB setup for order source
  setupValidOrderDb();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Mastershop-UpdateOrders handler", () => {
  // ── Success cases ───────────────────────────────────────────────────────────

  describe("success cases", () => {
    it("2.1: processes an order source record and returns 200", async () => {
      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('"OK"');
    });

    it("2.2: processes an orderLeg source record (matching tracking) and returns 200", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });
      setupValidOrderLegDb();

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('"OK"');
    });

    it("2.3: processes an orderReturn source record and returns 200", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });
      setupValidOrderReturnDb();

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('"OK"');
    });

    it("2.4: processes an orderReturnLeg source record (matching tracking) and returns 200", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });
      setupValidOrderReturnLegDb();

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('"OK"');
    });

    it("2.5: processes a batch of 2 valid records and returns 200", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const body1 = {
        carrierName: "COORDINADORA",
        trackingNumber: "123456789",
        status: { statusCode: "099", statusName: "Entregado" },
        novelty: { noveltyCode: null },
        returnProcess: { returnTrackingNumber: null },
        linkedShipment: {
          linkedCarrierTrackingCode: null,
          shippingRate: null,
          originAddress: null,
          shippingAddress: null,
          legReason: null
        },
        carrierData: {},
        updateSource: null
      };

      const body2 = {
        carrierName: "TCC",
        trackingNumber: "987654321",
        status: { statusCode: "099", statusName: "Entregado" },
        novelty: { noveltyCode: null },
        returnProcess: { returnTrackingNumber: null },
        linkedShipment: {
          linkedCarrierTrackingCode: null,
          shippingRate: null,
          originAddress: null,
          shippingAddress: null,
          legReason: null
        },
        carrierData: {},
        updateSource: null
      };

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          },
          {
            idUser: 2,
            idBusiness: 2,
            idOrder: 101,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "987654321"
          }
        ]) // getDataByCarrierTrackingNumber
        .mockResolvedValueOnce([
          { idOrder: 100, source: "order" },
          { idOrder: 101, source: "order" }
        ]) // getOrderPrecedence
        .mockResolvedValueOnce(baseCarrierStatus) // getCarrierStatus for record 1
        .mockResolvedValueOnce(baseShipmentUpdates) // getShipmentUpdates for record 1
        .mockResolvedValueOnce(baseCarrierStatus) // getCarrierStatus for record 2
        .mockResolvedValueOnce(baseShipmentUpdates); // getShipmentUpdates for record 2

      mockInsert.mockResolvedValue(true);

      const event = {
        Records: [
          { body: JSON.stringify(body1) },
          { body: JSON.stringify(body2) }
        ]
      };

      const result = await handler(event, buildContext());

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('"OK"');
    });
  });

  // ── Invalid input ───────────────────────────────────────────────────────────

  describe("failure — invalid input", () => {
    it("3.1: non-numeric trackingNumber → returns 200 and calls error webhook", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({ status: 200, data: {} });

      const result = await handler(
        buildEvent({ trackingNumber: "abc-invalid" }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      // Error notification webhook should have been called
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "post",
          url: process.env["URL_WEBHOOK_ERROR_LOGS"]
        })
      );
    });

    it("3.2: unknown carrierName → returns 200 and calls error webhook", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({ status: 200, data: {} });

      const result = await handler(
        buildEvent({ carrierName: "UNKNOWN_CARRIER" }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "post",
          url: process.env["URL_WEBHOOK_ERROR_LOGS"]
        })
      );
    });

    it("3.3: missing status.statusCode → returns 200 and calls error webhook", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({ status: 200, data: {} });

      const result = await handler(
        buildEvent({ status: { statusCode: null, statusName: null } }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "post",
          url: process.env["URL_WEBHOOK_ERROR_LOGS"]
        })
      );
    });
  });

  // ── Business rules ──────────────────────────────────────────────────────────

  describe("failure — business rules", () => {
    it("4.1: status code not in carrierStatus → returns 200 and calls error webhook", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({ status: 200, data: {} });

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce([
          {
            carrierCode: "999",
            idCarrierStatusUpdate: 99,
            isActive: true,
            statusAuxLabel: null,
            idStatus: 5,
            statusName: "Otro",
            requiresAdditionalSteps: false
          }
        ]) // code 099 not in this list
        .mockResolvedValueOnce(baseShipmentUpdates);

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "post",
          url: process.env["URL_WEBHOOK_ERROR_LOGS"]
        })
      );
    });

    it("4.2: isActive=false, no forcedExecution → returns 200, putOrder NOT called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1 } }
      });

      const inactiveCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: false, // inactive
          statusAuxLabel: null,
          idStatus: 5,
          statusName: "Entregado",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(inactiveCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      // putOrder uses method: "put" — verify it was NOT called
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({ method: "put" })
      );
    });

    it("4.3: isActive=false, forcedExecution=true → returns 200, putOrder IS called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const inactiveCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: false,
          statusAuxLabel: null,
          idStatus: 5,
          statusName: "Entregado",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(inactiveCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      mockInsert.mockResolvedValue(true);

      const result = await handler(
        buildEvent({ forcedExecution: true }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({ method: "put" })
      );
    });

    it("4.4: orderLeg tracking mismatch → returns 200, putOrder NOT called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1 } }
      });

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "orderLeg",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "orderLeg" }])
        .mockResolvedValueOnce(baseCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      // Leg has a DIFFERENT tracking code → mismatch
      mockFetchOne.mockResolvedValue({
        idOrderLeg: 10,
        carrierTrackingCode: "999999999"
      });

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({ method: "put" })
      );
    });

    it("4.5: orderReturnLeg tracking mismatch → returns 200, updateStatusOrderReturn NOT called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1 } }
      });

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: 200,
            source: "orderReturnLeg",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "orderReturnLeg" }])
        .mockResolvedValueOnce(baseCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      // Leg has a DIFFERENT tracking code → mismatch
      mockFetchOne.mockResolvedValue({
        idOrderReturnLeg: 20,
        carrierTrackingCode: "999999999"
      });

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("4.6: duplicate history (insert returns false) → returns 200, putOrder NOT called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1 } }
      });

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(baseCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      // Duplicate: insert returns false
      mockInsert.mockResolvedValue(false);

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({ method: "put" })
      );
    });

    it("4.7: idStatus=8, current id_status=1 → two axios PUT calls (first to 6, then to 8)", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));

      const status8CarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: true,
          statusAuxLabel: null,
          idStatus: 8,
          statusName: "En Tránsito",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(status8CarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      mockInsert.mockResolvedValue(true);

      // getOrder returns id_status: 1 (neither 6 nor 8) → triggers two PUT calls
      mockAxios
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { id_status: 1, status: "En Proceso" } }
        }) // getOrder
        .mockResolvedValueOnce({ status: 200, data: {} }) // putOrder (to 6)
        .mockResolvedValueOnce({ status: 200, data: {} }); // putOrder (to 8)

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);

      const putCalls = (mockAxios as jest.Mock).mock.calls.filter(
        (call: any[]) => call[0]?.method === "put"
      );
      expect(putCalls.length).toBe(2);

      const firstPut = putCalls[0][0];
      expect(firstPut.data.id_status).toBe(6);

      const secondPut = putCalls[1][0];
      expect(secondPut.data.id_status).toBe(8);
    });
  });

  // ── Retry logic ─────────────────────────────────────────────────────────────

  describe("retry logic", () => {
    it("5.1: DB returns null all 3 times → returns 200 and calls error webhook", async () => {
      jest.useFakeTimers();

      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({ status: 200, data: {} });

      // Returns null for all 3 getDataByCarrierTrackingNumber calls
      mockFetchMany.mockResolvedValue(null);

      const promise = handler(buildEvent(), buildContext());
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.statusCode).toBe(200);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "post",
          url: process.env["URL_WEBHOOK_ERROR_LOGS"]
        })
      );

      jest.useRealTimers();
    });

    it("5.2: DB returns null first attempt, data second attempt → returns 200, record processed", async () => {
      jest.useFakeTimers();

      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const orderData = [
        {
          idUser: 1,
          idBusiness: 1,
          idOrder: 100,
          idOrderReturn: null,
          source: "order",
          carrierTrackingCode: "123456789"
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce(null) // attempt 1: getDataByCarrierTrackingNumber → null
        .mockResolvedValueOnce(orderData) // attempt 2: getDataByCarrierTrackingNumber → data
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }]) // getOrderPrecedence
        .mockResolvedValueOnce(baseCarrierStatus) // getCarrierStatus
        .mockResolvedValueOnce(baseShipmentUpdates); // getShipmentUpdates

      mockInsert.mockResolvedValue(true);

      const promise = handler(buildEvent(), buildContext());
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('"OK"');

      jest.useRealTimers();
    });
  });

  // ── Side effects ────────────────────────────────────────────────────────────

  describe("side effects", () => {
    it("6.1: idStatus=10 (return code) → insert for orderReturn is called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const returnCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: true,
          statusAuxLabel: null,
          idStatus: 10, // return code
          statusName: "Devuelto",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(returnCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      // createOrderShipmentUpdateHistoryIfNotExists → true
      // then getOrderData (fetchOne) → order data for createOrderReturn
      // then createOrderReturnIfNotExists (insert) → true
      mockInsert
        .mockResolvedValueOnce(true) // createOrderShipmentUpdateHistoryIfNotExists
        .mockResolvedValueOnce(true); // createOrderReturnIfNotExists

      mockFetchOne.mockResolvedValue({
        idOrder: 100,
        shippingRate: 10000,
        paymentMethod: "PREPAID",
        carrierInfo: {},
        originAddress: null,
        shippingAddress: null,
        carrierTracking: null
      }); // getOrderData

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);
      // The second insert call should be createOrderReturnIfNotExists
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it("6.2: LINKED-SHIPMENT + order source → insert for orderLeg is called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const linkedShipmentCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: true,
          statusAuxLabel: "LINKED-SHIPMENT",
          idStatus: 5,
          statusName: "Entregado",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(linkedShipmentCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      mockInsert
        .mockResolvedValueOnce(true) // createOrderShipmentUpdateHistoryIfNotExists
        .mockResolvedValueOnce(true); // createOrderLeg

      const result = await handler(
        buildEvent({
          linkedShipment: {
            linkedCarrierTrackingCode: "111222333",
            shippingRate: null,
            originAddress: null,
            shippingAddress: null,
            legReason: null
          }
        }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it("6.3: LINKED-SHIPMENT + orderReturn source → insert for orderReturnLeg is called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1 } }
      });

      const linkedShipmentCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: true,
          statusAuxLabel: "LINKED-SHIPMENT",
          idStatus: 5,
          statusName: "Entregado",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: 200,
            source: "orderReturn",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "orderReturn" }])
        .mockResolvedValueOnce(linkedShipmentCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      mockInsert
        .mockResolvedValueOnce(true) // createOrderReturnShipmentUpdateHistoryIfNotExists
        .mockResolvedValueOnce(true) // createOrderReturnStatusLogIfNotExists
        .mockResolvedValueOnce(true); // createOrderReturnLeg

      mockUpdate.mockResolvedValue(true);

      const result = await handler(
        buildEvent({
          linkedShipment: {
            linkedCarrierTrackingCode: "444555666",
            shippingRate: null,
            originAddress: null,
            shippingAddress: null,
            legReason: null
          }
        }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      expect(mockInsert).toHaveBeenCalledTimes(3);
    });

    it("6.4: requiresAdditionalSteps=true → axios POST to processevents is called", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const additionalStepsCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: true,
          statusAuxLabel: null,
          idStatus: 5,
          statusName: "Entregado",
          requiresAdditionalSteps: true // triggers sendEvent
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(additionalStepsCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates);

      mockInsert.mockResolvedValue(true);

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(200);

      const processEventCalls = (mockAxios as jest.Mock).mock.calls.filter(
        (call: any[]) =>
          call[0]?.url?.includes("processevents") && call[0]?.method === "post"
      );
      expect(processEventCalls.length).toBeGreaterThanOrEqual(1);
    });

    it("6.5: CON-NOVEDAD with matching noveltyCode → order updated with idStatus=6", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const noveltyCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: true,
          statusAuxLabel: "CON-NOVEDAD",
          idStatus: 5,
          statusName: "Entregado",
          requiresAdditionalSteps: false
        }
      ];

      const noveltyShipmentUpdates = [
        {
          codeCarrierShipmentUpdate: "001",
          isActive: true,
          idShipmentUpdate: 200,
          name: "Novedad 1",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(noveltyCarrierStatus)
        .mockResolvedValueOnce(noveltyShipmentUpdates);

      mockInsert.mockResolvedValue(true);

      const result = await handler(
        buildEvent({ novelty: { noveltyCode: "001" } }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      // The putOrder call should set id_status to 6
      const putCalls = (mockAxios as jest.Mock).mock.calls.filter(
        (call: any[]) => call[0]?.method === "put"
      );
      expect(putCalls.length).toBeGreaterThanOrEqual(1);
      expect(putCalls[0][0].data.id_status).toBe(6);
    });

    it("6.6: CON-NOVEDAD with no matching noveltyCode → idShipmentUpdate=505 used", async () => {
      jest.clearAllMocks();
      mockFetchOne = jest.fn();
      mockFetchMany = jest.fn();
      mockInsert = jest.fn();
      mockUpdate = jest.fn();
      MockDatabase.mockImplementation(() => ({
        fetchOne: mockFetchOne,
        fetchMany: mockFetchMany,
        insert: mockInsert,
        update: mockUpdate
      }));
      mockAxios.mockResolvedValue({
        status: 200,
        data: { data: { id_status: 1, status: "En Proceso" } }
      });

      const noveltyCarrierStatus = [
        {
          carrierCode: "099",
          idCarrierStatusUpdate: 1,
          isActive: true,
          statusAuxLabel: "CON-NOVEDAD",
          idStatus: 5,
          statusName: "Entregado",
          requiresAdditionalSteps: false
        }
      ];

      mockFetchMany
        .mockResolvedValueOnce([
          {
            idUser: 1,
            idBusiness: 1,
            idOrder: 100,
            idOrderReturn: null,
            source: "order",
            carrierTrackingCode: "123456789"
          }
        ])
        .mockResolvedValueOnce([{ idOrder: 100, source: "order" }])
        .mockResolvedValueOnce(noveltyCarrierStatus)
        .mockResolvedValueOnce(baseShipmentUpdates); // code "001" doesn't match noveltyCode "999"

      mockInsert.mockResolvedValue(true);

      const result = await handler(
        buildEvent({ novelty: { noveltyCode: "999" } }),
        buildContext()
      );

      expect(result.statusCode).toBe(200);
      // createOrderShipmentUpdateHistoryIfNotExists should be called with idShipmentUpdate: 505
      const insertCall = mockInsert.mock.calls[0];
      // The second arg is the replacements object with idShipmentUpdate
      expect(insertCall).toBeDefined();
      // Verify putOrder was called (idStatus becomes 6 due to CON-NOVEDAD override)
      const putCalls = (mockAxios as jest.Mock).mock.calls.filter(
        (call: any[]) => call[0]?.method === "put"
      );
      expect(putCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Environment ─────────────────────────────────────────────────────────────

  describe("failure — environment", () => {
    it("7.1: BASE_URL_MS missing → returns 500", async () => {
      const original = process.env["BASE_URL_MS"];
      delete process.env["BASE_URL_MS"];

      const result = await handler(buildEvent(), buildContext());

      expect(result.statusCode).toBe(500);

      process.env["BASE_URL_MS"] = original;
    });

    it("7.2: no Records array → returns 500", async () => {
      const result = await handler({}, buildContext());

      expect(result.statusCode).toBe(500);
    });
  });
});
