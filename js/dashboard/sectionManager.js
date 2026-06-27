// Section manager — scroll behavior (placeholder for future active-section logic)
export const SectionManager = {
  scrollTo(id) {
    const node = document.getElementById(`section-${id}`);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  init() {},
};