// PPcode (o componente original) foi escrito como "artifact" do Claude.ai e usa
// `window.storage.get/set/delete`, uma API que só existe dentro do sandbox do Claude.ai.
// Este módulo cria essa mesma API no browser real, apoiada em localStorage, para o
// componente correr sem alterações fora do Claude.ai. Na Fase 3, as funções que usam
// window.storage (loadUsers, loadSession, loadHistory, loadExerciseLibrary, etc., todas
// no próprio page.js) são substituídas por chamadas ao Supabase — este shim deixa de ser
// necessário nessa altura.
function ensureWindowStorage() {
  if (typeof window === "undefined") return;
  if (window.storage) return;
  window.storage = {
    async get(key) {
      const raw = window.localStorage.getItem(key);
      return raw === null ? null : { value: raw };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
    },
    async delete(key) {
      window.localStorage.removeItem(key);
    },
  };
}

ensureWindowStorage();
