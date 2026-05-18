import React from 'react';
import { COLORS } from './shared';

export default function PrivacyPolicy() {
  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', color: COLORS.textMuted, lineHeight: 1.8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <img src="/link-ap-logo.png" alt="Link-AP" style={{ width: 40, height: 40, borderRadius: 8 }} />
          <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Link-<span style={{ color: COLORS.accent }}>AP</span></span>
        </div>

        <h1 style={{ color: '#fff', fontSize: 32, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: COLORS.textMuted, marginBottom: 40 }}>Last updated: 8 May 2026</p>

        <p>Link-AP ("we", "our", or "us") operates the Link-AP mobile and web application. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.</p>

        {[
          { title: '1. Information We Collect', content: 'When you create an account or use Link-AP, we may collect: your name, email address, and profile photo; professional information such as your role, skills, and bio; messages and connection activity; and device and usage data for performance purposes.' },
          { title: '2. How We Use Your Information', content: 'We use your information to create and manage your account, match you with relevant co-founders, investors, mentors and collaborators, enable messaging and networking features, improve the app, send service-related notifications, and comply with legal obligations.' },
          { title: '3. Google Sign-In', content: 'Link-AP offers sign-in via Google. When you use this feature, Google shares your name, email address, and profile picture with us. We do not receive your Google password. Your use of Google Sign-In is also governed by Google\'s Privacy Policy.' },
          { title: '4. Firebase Services', content: 'Link-AP is built on Google Firebase, which provides authentication, database, and hosting services. Firebase may collect certain usage and diagnostic data. See Firebase\'s Privacy Policy for more information.' },
          { title: '5. Data Sharing', content: 'We do not sell your personal information. We may share it only with other Link-AP users (to the extent your profile is visible), service providers such as Firebase, or if required by law.' },
          { title: '6. Data Storage and Security', content: 'Your data is stored securely using Google Firebase infrastructure. We implement appropriate technical and organisational measures to protect your information. However, no method of transmission over the internet is 100% secure.' },
          { title: '7. Your Rights', content: 'You have the right to access, correct, or delete your personal information, and to withdraw consent at any time by deleting your account. Contact us to exercise these rights.' },
          { title: '8. Children\'s Privacy', content: 'Link-AP is not intended for users under the age of 18. We do not knowingly collect personal information from children.' },
          { title: '9. Changes to This Policy', content: 'We may update this Privacy Policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.' },
        ].map(({ title, content }) => (
          <div key={title}>
            <h2 style={{ color: '#fff', fontSize: 18, marginTop: 36, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${COLORS.border}` }}>{title}</h2>
            <p>{content}</p>
          </div>
        ))}

        <h2 style={{ color: '#fff', fontSize: 18, marginTop: 36, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${COLORS.border}` }}>10. Contact Us</h2>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginTop: 16 }}>
          <p><strong style={{ color: '#fff' }}>Link-AP</strong></p>
          <p>Email: <a href="mailto:info@link-ap.online" style={{ color: COLORS.accent }}>info@link-ap.online</a></p>
          <p>Website: <a href="https://link-ap.online" style={{ color: COLORS.accent }}>link-ap.online</a></p>
        </div>

        <p style={{ marginTop: 60, paddingTop: 24, borderTop: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' }}>
          &copy; 2026 Link-AP. All rights reserved.
        </p>
      </div>
    </div>
  );
}