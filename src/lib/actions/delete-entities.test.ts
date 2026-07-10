import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAdminSession = vi.fn();
const mockCreateClient = vi.fn();
const mockSafeDeleteReplacedMenuImage = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAdminSession: (...args: unknown[]) => mockRequireAdminSession(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

vi.mock("@/lib/storage/menu-bucket", () => ({
  safeDeleteReplacedMenuImage: (...args: unknown[]) =>
    mockSafeDeleteReplacedMenuImage(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

describe("admin delete actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockRequireAdminSession.mockResolvedValue({
      userId: "admin-id",
      profile: { role: "ADMIN" },
    });
    mockSafeDeleteReplacedMenuImage.mockResolvedValue(undefined);
  });

  it("rejects unauthorized delete attempts", async () => {
    mockRequireAdminSession.mockRejectedValue(new Error("FORBIDDEN"));
    const { deleteProduct } = await import("@/lib/actions/products");

    await expect(deleteProduct(PRODUCT_ID)).rejects.toThrow("FORBIDDEN");
  });

  it("blocks category delete when products exist", async () => {
    mockCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === "categories") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { name_ar: "حلويات" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "products") {
          return {
            select: () => ({
              eq: async () => ({ count: 2, error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { deleteCategory } = await import("@/lib/actions/categories");
    const result = await deleteCategory(CATEGORY_ID);

    expect(result.error).toBe("لا يمكن حذف القسم لأنه يحتوي على منتجات");
  });

  it("deletes product and cleans image after database delete", async () => {
    const deleteEq = vi.fn(async () => ({ error: null }));
    const imageUrl =
      "https://example.supabase.co/storage/v1/object/public/menu/products/a.webp";

    mockCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === "products") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { name_ar: "برger", image_url: imageUrl },
                  error: null,
                }),
              }),
            }),
            delete: () => ({
              eq: deleteEq,
            }),
          };
        }
        if (table === "order_items") {
          return {
            select: () => ({
              eq: async () => ({ count: 0, error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { deleteProduct } = await import("@/lib/actions/products");
    const result = await deleteProduct(PRODUCT_ID);

    expect(result.success).toBe("تم حذف المنتج");
    expect(deleteEq).toHaveBeenCalledWith("id", PRODUCT_ID);
    expect(mockSafeDeleteReplacedMenuImage).toHaveBeenCalledWith(imageUrl, null);
  });

  it("blocks add-on delete when referenced by products", async () => {
    const ADD_ON_ID = "33333333-3333-4333-8333-333333333333";

    mockCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === "add_ons") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { name_ar: "جبنة" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "product_add_ons") {
          return {
            select: () => ({
              eq: async () => ({ count: 1, error: null }),
            }),
          };
        }
        if (table === "order_item_add_ons") {
          return {
            select: () => ({
              eq: async () => ({ count: 0, error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { deleteAddOn } = await import("@/lib/actions/add-ons");
    const result = await deleteAddOn(ADD_ON_ID);

    expect(result.error).toContain("مرتبطة بمنتجات");
  });

  it("blocks table delete when orders exist", async () => {
    const TABLE_ID = "44444444-4444-4444-8444-444444444444";

    mockCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === "tables") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { label: "10" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "orders") {
          return {
            select: () => ({
              eq: async () => ({ count: 3, error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { deleteTable } = await import("@/lib/actions/tables");
    const result = await deleteTable(TABLE_ID);

    expect(result.error).toContain("إيقاف الطاولة");
  });

  it("product delete preview keeps canDelete true with order history", async () => {
    mockCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === "products") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { name_ar: "برger" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "order_items") {
          return {
            select: () => ({
              eq: async () => ({ count: 7, error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { getProductDeletePreview } = await import("@/lib/actions/products");
    const preview = await getProductDeletePreview(PRODUCT_ID);

    expect(preview.canDelete).toBe(true);
    expect(preview.dependencyLines.join(" ")).toMatch(/الطلبات السابقة/);
  });
});
