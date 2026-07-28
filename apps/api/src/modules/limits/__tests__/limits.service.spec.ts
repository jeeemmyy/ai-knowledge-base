import { LimitsService, DOCUMENT_LIMIT, MESSAGE_LIMIT } from '../limits.service';

function build(row: Record<string, unknown> | null, adminEmails = '') {
  process.env.ADMIN_EMAILS = adminEmails;
  const maybeSingle = jest.fn(async () => ({ data: row, error: null }));
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));
  const rpc = jest.fn(async () => ({ error: null }));
  const supabase = { admin: { from, rpc } };
  return new LimitsService(supabase as never);
}

const user = { id: 'u1', email: 'user@example.com' } as never;

describe('LimitsService', () => {
  afterEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it('allows a free user under the caps', async () => {
    const svc = build({ unlimited: false, documents_created: 2, messages_sent: 3 });
    await expect(svc.assertCanCreateDocument(user)).resolves.toBeUndefined();
    await expect(svc.assertCanSendMessage(user)).resolves.toBeUndefined();
    const status = await svc.getStatus(user);
    expect(status).toMatchObject({ unlimited: false, documentsUsed: 2, messagesUsed: 3, documentLimit: DOCUMENT_LIMIT, messageLimit: MESSAGE_LIMIT });
  });

  it('blocks a free user at the document cap', async () => {
    const svc = build({ unlimited: false, documents_created: DOCUMENT_LIMIT, messages_sent: 0 });
    await expect(svc.assertCanCreateDocument(user)).rejects.toThrow(/limit of 5 documents/i);
  });

  it('blocks a free user at the message cap', async () => {
    const svc = build({ unlimited: false, documents_created: 0, messages_sent: MESSAGE_LIMIT });
    await expect(svc.assertCanSendMessage(user)).rejects.toThrow(/limit of 10 messages/i);
  });

  it('never blocks an unlimited user', async () => {
    const svc = build({ unlimited: true, documents_created: 99, messages_sent: 99 });
    await expect(svc.assertCanCreateDocument(user)).resolves.toBeUndefined();
    await expect(svc.assertCanSendMessage(user)).resolves.toBeUndefined();
  });

  it('treats admins as unlimited even when the flag is false', async () => {
    const svc = build({ unlimited: false, documents_created: 99, messages_sent: 99 }, 'user@example.com');
    const status = await svc.getStatus(user);
    expect(status.unlimited).toBe(true);
    await expect(svc.assertCanCreateDocument(user)).resolves.toBeUndefined();
  });
});
