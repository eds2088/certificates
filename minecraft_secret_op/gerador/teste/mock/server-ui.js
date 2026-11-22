export const formQueue = [];
class Base { constructor() { this.buttons = []; } title() { return this; } body() { return this; } button(t) { this.buttons.push(t); return this; }
  dropdown() { return this; } slider() { return this; } toggle() { return this; }
  show() { const r = formQueue.shift() ?? { canceled: true }; return Promise.resolve(typeof r === 'function' ? r(this.buttons) : r); } }
export class ActionFormData extends Base {}
export class ModalFormData extends Base {}
