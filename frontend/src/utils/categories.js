// Cây danh mục từ GET /api/categories (mảng trần, không bọc ApiResponse; lá có children = null).

/** Cây -> danh sách phẳng giữ thứ tự cha trước con: [{ id, name, slug, parentId, depth, aiProduceKeys, productCount, hasChildren }]. */
export const flattenCategoryTree = (tree) => {
  const result = [];
  const walk = (nodes, depth, parentId) => {
    (nodes ?? []).forEach((c) => {
      const children = c.children ?? [];
      result.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId ?? parentId ?? null,
        depth,
        aiProduceKeys: c.aiProduceKeys ?? null,
        productCount: c.productCount ?? 0,
        hasChildren: children.length > 0
      });
      walk(children, depth + 1, c.id);
    });
  };
  walk(Array.isArray(tree) ? tree : [], 0, null);
  return result;
};

/** Tìm danh mục theo slug trong danh sách phẳng, không có -> null. */
export const findCategoryBySlug = (flat, slug) => (flat ?? []).find((c) => c.slug === slug) ?? null;

export const findCategoryById = (flat, id) => (flat ?? []).find((c) => String(c.id) === String(id)) ?? null;

/** "tomato, potato" -> ["tomato", "potato"] (chữ thường, bỏ khoảng trắng, bỏ phần rỗng). */
export const parseProduceKeys = (keys) =>
  (keys ?? "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

/** Khóa AI hiệu lực của danh mục: của chính nó, trống thì lấy của cha — khớp luật AI dòng 2 (docs/1910.md mục 1). */
export const effectiveProduceKeys = (flat, category) => {
  if (!category) return [];
  const own = parseProduceKeys(category.aiProduceKeys);
  if (own.length > 0) return own;
  const parent = findCategoryById(flat, category.parentId);
  return parent ? parseProduceKeys(parent.aiProduceKeys) : [];
};
