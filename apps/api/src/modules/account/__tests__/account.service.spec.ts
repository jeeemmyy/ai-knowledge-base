import { AccountService } from '../account.service';
import type { UserProfile } from '../profiles.repository';

const future = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 1000).toISOString();

function makeProfile(over: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: 'u1',
    email: 'user@example.com',
    emailVerified: false,
    verificationCode: null,
    verificationExpiresAt: null,
    verificationSentAt: null,
    resetCode: null,
    resetExpiresAt: null,
    resetSentAt: null,
    ...over,
  };
}

function build() {
  const profiles = {
    ensure: jest.fn(),
    getByEmail: jest.fn(),
    setVerificationCode: jest.fn(async () => undefined),
    markVerified: jest.fn(async () => undefined),
    setResetCode: jest.fn(async () => undefined),
    clearResetCode: jest.fn(async () => undefined),
  };
  const email = {
    isConfigured: jest.fn(async () => true),
    sendVerificationCode: jest.fn(async () => undefined),
    sendPasswordResetCode: jest.fn(async () => undefined),
  };
  const settings = { getMany: jest.fn(async () => ({})) };
  const updateUserById = jest.fn(async () => ({ error: null }));
  const supabase = { admin: { auth: { admin: { updateUserById } } } };

  const service = new AccountService(
    supabase as never,
    profiles as never,
    email as never,
    settings as never,
  );
  return { service, profiles, email, updateUserById };
}

const user = { id: 'u1', email: 'user@example.com', provider: 'email' };

describe('AccountService', () => {
  it('getMe reports verified when email is not configured', async () => {
    const { service, profiles, email } = build();
    profiles.ensure.mockResolvedValue(makeProfile({ emailVerified: false }));
    email.isConfigured.mockResolvedValue(false);
    const me = await service.getMe(user as never);
    expect(me.emailVerified).toBe(true);
  });

  it('startVerification generates + emails a code', async () => {
    const { service, profiles, email } = build();
    profiles.ensure.mockResolvedValue(makeProfile());
    const r = await service.startVerification(user as never);
    expect(r.sent).toBe(true);
    expect(profiles.setVerificationCode).toHaveBeenCalledWith('u1', expect.stringMatching(/^\d{6}$/), expect.any(String));
    expect(email.sendVerificationCode).toHaveBeenCalledWith('user@example.com', expect.stringMatching(/^\d{6}$/));
  });

  it('confirmVerification rejects a wrong code', async () => {
    const { service, profiles } = build();
    profiles.ensure.mockResolvedValue(makeProfile({ verificationCode: '111111', verificationExpiresAt: future() }));
    await expect(service.confirmVerification(user as never, '999999')).rejects.toThrow(/incorrect/i);
    expect(profiles.markVerified).not.toHaveBeenCalled();
  });

  it('confirmVerification rejects an expired code', async () => {
    const { service, profiles } = build();
    profiles.ensure.mockResolvedValue(makeProfile({ verificationCode: '111111', verificationExpiresAt: past() }));
    await expect(service.confirmVerification(user as never, '111111')).rejects.toThrow(/expired/i);
  });

  it('confirmVerification accepts the correct code', async () => {
    const { service, profiles } = build();
    profiles.ensure
      .mockResolvedValueOnce(makeProfile({ verificationCode: '111111', verificationExpiresAt: future() }))
      .mockResolvedValueOnce(makeProfile({ emailVerified: true }));
    const me = await service.confirmVerification(user as never, '111111');
    expect(profiles.markVerified).toHaveBeenCalledWith('u1');
    expect(me.emailVerified).toBe(true);
  });

  it('requestPasswordReset stays silent for an unknown email', async () => {
    const { service, profiles, email } = build();
    profiles.getByEmail.mockResolvedValue(null);
    await service.requestPasswordReset('nobody@example.com');
    expect(email.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('confirmPasswordReset updates the password on a valid code', async () => {
    const { service, profiles, updateUserById } = build();
    profiles.getByEmail.mockResolvedValue(makeProfile({ resetCode: '222222', resetExpiresAt: future() }));
    await service.confirmPasswordReset('user@example.com', '222222', 'newpassword');
    expect(updateUserById).toHaveBeenCalledWith('u1', { password: 'newpassword' });
    expect(profiles.clearResetCode).toHaveBeenCalledWith('u1');
  });

  it('confirmPasswordReset rejects a wrong code', async () => {
    const { service, profiles, updateUserById } = build();
    profiles.getByEmail.mockResolvedValue(makeProfile({ resetCode: '222222', resetExpiresAt: future() }));
    await expect(service.confirmPasswordReset('user@example.com', '000000', 'newpassword')).rejects.toThrow();
    expect(updateUserById).not.toHaveBeenCalled();
  });
});
