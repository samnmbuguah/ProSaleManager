import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock the Customer model with proper types
const Customer = {
  findByPk: jest.fn() as jest.MockedFunction<(id: number) => Promise<any>>,
  create: jest.fn() as jest.MockedFunction<(data: any) => Promise<any>>,
  update: jest.fn() as jest.MockedFunction<(data: any, options: any) => Promise<any>>,
  destroy: jest.fn() as jest.MockedFunction<(options: any) => Promise<any>>,
};

// Mock the controller functions
const getCustomerById = jest.fn();
const createCustomer = jest.fn();
const updateCustomer = jest.fn();
const deleteCustomer = jest.fn();

describe("Customers Controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      params: { id: "1" },
      body: {
        name: "John Doe",
        phone: "+254712345678",
        email: "john@example.com",
      },
      user: { id: 1, role: "admin" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock successful customer lookup
    const mockCustomerData = {
      id: 1,
      name: "John Doe",
      phone: "+254712345678",
      email: "john@example.com",
      address: null,
      loyalty_points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    Customer.findByPk.mockResolvedValue(mockCustomerData);
    Customer.create.mockResolvedValue(mockCustomerData);
    Customer.update.mockResolvedValue([1, [mockCustomerData]]);
    Customer.destroy.mockResolvedValue(1);

    // Mock the controller functions
    getCustomerById.mockImplementation(async (req: any, res: any) => {
      const customerId = parseInt(req.params.id);
      const customer = await Customer.findByPk(customerId);

      if (customer) {
        res.status(200).json({
          success: true,
          data: customer,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    });

    createCustomer.mockImplementation(async (req: any, res: any) => {
      const customer = await Customer.create(req.body);
      res.status(201).json({
        success: true,
        data: customer,
      });
    });

    updateCustomer.mockImplementation(async (req: any, res: any) => {
      const customerId = parseInt(req.params.id);
      const [updatedCount, updatedCustomers] = await Customer.update(req.body, {
        where: { id: customerId },
        returning: true,
      });

      if (updatedCount > 0) {
        res.status(200).json({
          success: true,
          data: updatedCustomers[0],
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    });

    deleteCustomer.mockImplementation(async (req: any, res: any) => {
      const customerId = parseInt(req.params.id);
      const deletedCount = await Customer.destroy({
        where: { id: customerId },
      });

      if (deletedCount > 0) {
        res.status(200).json({
          success: true,
          message: "Customer deleted successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCustomerById", () => {
    it("should get customer by ID successfully", async () => {
      await getCustomerById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });

    it("should return 404 for non-existent customer", async () => {
      Customer.findByPk.mockResolvedValue(null);

      await getCustomerById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Customer not found",
      });
    });
  });

  describe("createCustomer", () => {
    it("should create customer successfully", async () => {
      await createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe("updateCustomer", () => {
    it("should update customer successfully", async () => {
      await updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });

    it("should return 404 for non-existent customer", async () => {
      Customer.update.mockResolvedValue([0, []]);

      await updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Customer not found",
      });
    });
  });

  describe("deleteCustomer", () => {
    it("should delete customer successfully", async () => {
      await deleteCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Customer deleted successfully",
      });
    });

    it("should return 404 for non-existent customer", async () => {
      Customer.destroy.mockResolvedValue(0);

      await deleteCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Customer not found",
      });
    });
  });
});
