// Smart category display generation - no hardcoding
function generateCategoryDisplay(categoryName) {
  // Generate icon based on category name keywords
  const name = categoryName.toLowerCase();

  let icon = '🔧'; // default
  let color = '#6272a4'; // default Dracula color

  // Smart icon assignment based on category name
  if (name.includes('web') || name.includes('server') || name.includes('dns')) {
    icon = '🌐'; color = '#50fa7b';
  } else if (name.includes('database') || name.includes('storage') || name.includes('data')) {
    icon = '🗄️'; color = '#8be9fd';
  } else if (name.includes('container') || name.includes('orchestration')) {
    icon = '📦'; color = '#bd93f9';
  } else if (name.includes('security') || name.includes('auth') || name.includes('intrusion') || name.includes('vulnerability')) {
    icon = '🔒'; color = '#ff5555';
  } else if (name.includes('monitor') || name.includes('logging') || name.includes('tracing') || name.includes('alert')) {
    icon = '📊'; color = '#ffb86c';
  } else if (name.includes('communication') || name.includes('chat') || name.includes('video') || name.includes('mail') || name.includes('xmpp') || name.includes('matrix')) {
    icon = '💬'; color = '#f1fa8c';
  } else if (name.includes('media') || name.includes('streaming') || name.includes('music')) {
    icon = '🎬'; color = '#6272a4';
  } else if (name.includes('cms') || name.includes('documentation') || name.includes('education') || name.includes('business')) {
    icon = '📝'; color = '#ff79c6';
  } else if (name.includes('ci') || name.includes('git') || name.includes('infrastructure') || name.includes('configuration')) {
    icon = '🏗️'; color = '#44475a';
  } else if (name.includes('development') || name.includes('workflow') || name.includes('task') || name.includes('queue')) {
    icon = '💻'; color = '#8be9fd';
  }

  return { icon, color };
}

// Dynamic categories loaded from guides data
export function getCategoriesFromGuides(guides) {
  const categories = {};

  guides.forEach(guide => {
    if (!categories[guide.category]) {
      const display = generateCategoryDisplay(guide.category);

      categories[guide.category] = {
        key: guide.category,
        name: guide.category.charAt(0).toUpperCase() + guide.category.slice(1).replace(/-/g, ' '),
        description: `${guide.category.charAt(0).toUpperCase() + guide.category.slice(1).replace(/-/g, ' ')} tools and applications`,
        ...display,
        guides: []
      };
    }
    categories[guide.category].guides.push(guide);
  });

  return Object.values(categories).sort((a, b) => a.name.localeCompare(b.name));
}

// Fallback for when no guides data is available - returns empty array since everything is dynamic
export function getAllCategories() {
  return [];
}

// Get category info by key - completely dynamic
export function getCategoryInfo(categoryKey) {
  const display = generateCategoryDisplay(categoryKey);

  return {
    key: categoryKey,
    name: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).replace(/-/g, ' '),
    description: `${categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).replace(/-/g, ' ')} tools and applications`,
    ...display
  };
}