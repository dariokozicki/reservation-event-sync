import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  serverExternalPackages: ['pg', 'pg-boss'],
  poweredByHeader: false,
};

export default createNextIntlPlugin()(config);
