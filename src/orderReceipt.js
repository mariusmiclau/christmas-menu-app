// Capture names and prices at submission time, before the form or menu changes.
export function createOrderConfirmation(menu, order) {
  const dishes = [
    ['starter', 'starters', 'Starter'],
    ['main', 'mains', 'Main course'],
    ['dessert', 'desserts', 'Dessert'],
  ].filter(([field]) => order[field]).map(([field, category, label]) => {
    const item = menu[category].find((candidate) => candidate.id === order[field]);
    return {
      label,
      name: item?.name || 'Menu item no longer available',
      description: item?.description || '',
      preference: field === 'main' ? order.steakPreference : '',
    };
  });
  return {
    name: order.name.trim(),
    menuId: menu.id,
    menuTitle: menu.title,
    eventDate: menu.eventDate,
    courses: order.courses,
    price: Number(menu.courseOptions?.[order.courses]?.price || 0),
    orderDate: order.orderDate,
    dishes,
  };
}
