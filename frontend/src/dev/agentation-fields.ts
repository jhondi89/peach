/** 标注工具en la字段ConIndependiente表单身, 现Con id/name 由工具自己Gestionar.  */
export function identifyAgentationFields(host: HTMLElement): () => void {
  let sequence = 0;
  const watched = new WeakSet<Node>();
  const identify = (root: HTMLElement | ShadowRoot) => {
    if (!watched.has(root)) {
      watched.add(root);
      observer.observe(root, { childList: true, subtree: true });
    }
    for (const field of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input,textarea,select',
    )) {
      if (!field.id && !field.name) field.name = `peach-agentation-field-${++sequence}`;
    }
    for (const child of root.querySelectorAll('*')) {
      if (child.shadowRoot) identify(child.shadowRoot);
    }
  };
  const observer = new MutationObserver(() => identify(host));
  identify(host);
  return () => observer.disconnect();
}
