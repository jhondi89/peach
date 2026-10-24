/* 设置页的保存键统一经 i18n msgid「保存配置」并使用主按钮；主次层级与危险操作由浏览器和组件用例验收。 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, it } from 'vitest';

const dir = resolve(process.cwd(), 'src/react/settings');
const buttons = readdirSync(dir)
  .filter((name) => name.endsWith('.tsx'))
  .flatMap((name) => [...readFileSync(resolve(dir, name), 'utf8').matchAll(/<Button\b([\s\S]*?)<\/Button>/g)]
    .map(([, tag = '']) => ({ name, tag, label: tag.slice(tag.lastIndexOf('>') + 1).trim() })));

const isSaveConfig = (label: string) =>
  label === '保存配置' || label === "{t('保存配置')}" || /^\{t\(['"]保存配置['"]\)\}$/.test(label);

it('保存键一律经 t(「保存配置」)', () => {
  const saves = buttons.filter((button) => isSaveConfig(button.label) || button.label.includes('保存配置'));
  expect(saves.length).toBeGreaterThan(0);
  expect(saves.filter((button) => !isSaveConfig(button.label)).map((button) => `${button.name}: ${button.label}`)).toEqual([]);
});

it('保存配置使用主按钮', () => {
  const saves = buttons.filter((button) => isSaveConfig(button.label));
  expect(saves.filter((button) => /\bvariant=/.test(button.tag)).map((button) => button.name)).toEqual([]);
});
