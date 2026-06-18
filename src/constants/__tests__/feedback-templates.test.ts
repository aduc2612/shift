import { feedbackTemplates, buildMailtoUrl, FEEDBACK_EMAIL } from '../feedback-templates';

describe('feedbackTemplates', () => {
  it('has all expected types', () => {
    expect(feedbackTemplates).toHaveProperty('errorReport');
    expect(feedbackTemplates).toHaveProperty('featureRequest');
    expect(feedbackTemplates).toHaveProperty('other');
  });

  it('each template has label, subject, and body', () => {
    for (const tpl of Object.values(feedbackTemplates)) {
      expect(tpl.label).toBeTruthy();
      expect(tpl.subject).toBeTruthy();
      expect(tpl.subject).toContain('Shift AI');
      expect(tpl.body).toBeTruthy();
      expect(tpl.icon).toBeTruthy();
    }
  });
});

describe('buildMailtoUrl', () => {
  it('encodes subject and body correctly', () => {
    const url = buildMailtoUrl(feedbackTemplates.errorReport);
    expect(url).toContain('mailto:');
    expect(url).toContain(FEEDBACK_EMAIL);
    expect(url).toContain('subject=');
    expect(url).toContain('body=');
    expect(url.startsWith('mailto:')).toBe(true);
  });

  it('uses the feedback email constant', () => {
    const url = buildMailtoUrl(feedbackTemplates.featureRequest);
    expect(url).toContain(FEEDBACK_EMAIL);
  });
});
