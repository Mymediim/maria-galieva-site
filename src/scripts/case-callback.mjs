export const callbackEndpoint = 'https://it-production.dev/wp-json/contact-form-7/v1/contact-forms/7/feedback';
export function makeCallbackFields(form, openedAt, pageUrl) {
  const fields = new FormData(form);
  const contact = String(fields.get('contact') ?? '').trim();
  const comment = String(fields.get('comment') ?? '').trim();
  if (!contact || contact.length > 400) throw new Error('Укажите контакт, по которому с вами можно связаться.');
  if (comment.length > 2000) throw new Error('Сократите комментарий до 2000 символов.');
  if (fields.get('privacy_consent') !== '1') throw new Error('Подтвердите согласие на обработку данных заявки.');
  fields.set('your-name', 'Имя не указано');
  fields.set('your-phone', contact);
  fields.set('textarea', 'Заявка: продуктовый консалтинг.\n' + (comment ? 'Комментарий: ' + comment + '\n' : '') + 'Страница кейса: ' + pageUrl);
  fields.set('_wpcf7_unit_tag', 'wpcf7-f7-o1');
  fields.set('_itprod_ts', String(openedAt)); fields.set('website_url', '');
  fields.set('privacy_consent_version', '2026-11-25');
  fields.set('acceptance-559', '1');
  return fields;
}
export async function sendCallback(fields, request = fetch) {
  const response = await request(callbackEndpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: fields, redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (response.status === 429) throw new Error('Слишком много попыток. Попробуйте позже или напишите в Telegram.');
  if (!response.ok) throw new Error('Не удалось отправить заявку. Попробуйте ещё раз или напишите в Telegram.');
  const result = await response.json();
  if (result?.status !== 'mail_sent') throw new Error('Отправка не подтверждена. Попробуйте ещё раз или напишите в Telegram.');
}
export function bindCaseCallback(form) {
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.case-callback-status');
  let openedAt = Math.floor(Date.now() / 1000);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    status.hidden = false;
    try {
      const fields = makeCallbackFields(form, openedAt, location.origin + location.pathname);
      button.disabled = true; button.textContent = 'Отправляем…'; status.textContent = '';
      await sendCallback(fields);
      form.reset(); openedAt = Math.floor(Date.now() / 1000);
      status.textContent = 'Заявка отправлена. Свяжусь с вами по указанному контакту.';
    } catch(error) {
      status.textContent = error instanceof Error ? error.message : 'Не удалось подтвердить отправку. Напишите в Telegram.';
    } finally { button.disabled = false; button.textContent = 'Оставить заявку'; }
  });
}
