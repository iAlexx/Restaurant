export interface DeletePreview {
  canDelete: boolean;
  entityName: string;
  blockReason?: string;
  dependencyLines: string[];
  requireTypedConfirmation: boolean;
  typedConfirmationLabel?: string;
  typedConfirmationExpected?: string;
}

export const DELETE_CONFIRMATION_WORD = "حذف";

export function isTypedConfirmationValid(
  input: string,
  expected: string
): boolean {
  return input.trim() === expected.trim();
}

export function buildCategoryDeletePreview(
  entityName: string,
  productCount: number
): DeletePreview {
  if (productCount > 0) {
    return {
      canDelete: false,
      entityName,
      blockReason: "لا يمكن حذف القسم لأنه يحتوي على منتجات",
      dependencyLines: [
        `${productCount} منتج مرتبط بهذا القسم`,
        "انقل المنتجات إلى قسم آخر أو احذفها أولاً",
      ],
      requireTypedConfirmation: false,
    };
  }

  return {
    canDelete: true,
    entityName,
    dependencyLines: [],
    requireTypedConfirmation: true,
    typedConfirmationLabel: `اكتب "${DELETE_CONFIRMATION_WORD}" للتأكيد`,
    typedConfirmationExpected: DELETE_CONFIRMATION_WORD,
  };
}

export function buildProductDeletePreview(
  entityName: string,
  orderItemCount: number
): DeletePreview {
  const dependencyLines: string[] = [];
  if (orderItemCount > 0) {
    dependencyLines.push(
      `${orderItemCount} عنصر طلب سابق يشير إلى هذا المنتج`,
      "سيتم الاحتفاظ بأسماء وأسعار الطلبات السابقة كما هي"
    );
  }

  return {
    canDelete: true,
    entityName,
    dependencyLines,
    requireTypedConfirmation: orderItemCount > 0,
    typedConfirmationLabel:
      orderItemCount > 0
        ? `اكتب "${DELETE_CONFIRMATION_WORD}" للتأكيد`
        : undefined,
    typedConfirmationExpected:
      orderItemCount > 0 ? DELETE_CONFIRMATION_WORD : undefined,
  };
}

export function buildAddOnDeletePreview(
  entityName: string,
  productLinkCount: number,
  orderItemAddOnCount: number
): DeletePreview {
  if (productLinkCount > 0) {
    return {
      canDelete: false,
      entityName,
      blockReason:
        "لا يمكن حذف الإضافة لأنها مرتبطة بمنتجات حالياً",
      dependencyLines: [
        `${productLinkCount} منتج يستخدم هذه الإضافة`,
        "أزل الإضافة من المنتجات أولاً ثم حاول الحذف",
      ],
      requireTypedConfirmation: false,
    };
  }

  const dependencyLines: string[] = [];
  if (orderItemAddOnCount > 0) {
    dependencyLines.push(
      `${orderItemAddOnCount} عنصر طلب سابق يشير إلى هذه الإضافة`,
      "سيتم الاحتفاظ بأسماء وأسعار الطلبات السابقة كما هي"
    );
  }

  return {
    canDelete: true,
    entityName,
    dependencyLines,
    requireTypedConfirmation: true,
    typedConfirmationLabel: `اكتب "${DELETE_CONFIRMATION_WORD}" للتأكيد`,
    typedConfirmationExpected: DELETE_CONFIRMATION_WORD,
  };
}

export function buildTableDeletePreview(
  entityName: string,
  orderCount: number
): DeletePreview {
  if (orderCount > 0) {
    return {
      canDelete: false,
      entityName,
      blockReason:
        "لا يمكن حذف الطاولة لأنها مرتبطة بطلبات. استخدم إيقاف الطاولة بدلاً من ذلك.",
      dependencyLines: [
        `${orderCount} طلب مرتبط بهذه الطاولة`,
        "سجلات الطلبات التاريخية محفوظة — استخدم «إيقاف» لإخفاء الطاولة من الزبائن",
      ],
      requireTypedConfirmation: false,
    };
  }

  return {
    canDelete: true,
    entityName,
    dependencyLines: [
      "سيتوقف رمز QR الخاص بهذه الطاولة عن العمل بعد الحذف",
    ],
    requireTypedConfirmation: true,
    typedConfirmationLabel: `اكتب "${DELETE_CONFIRMATION_WORD}" للتأكيد`,
    typedConfirmationExpected: DELETE_CONFIRMATION_WORD,
  };
}
