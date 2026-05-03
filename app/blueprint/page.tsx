import type { Metadata } from 'next';
import Blueprint from '@/components/blueprint';

export const metadata: Metadata = {
  title: 'SRV-HTZNR-EU-SWS · Technical Blueprint',
  description: 'Single-host, four-service production stack. Solo-operated. Hetzner Falkenstein.',
};

export default function BlueprintPage() {
  return <Blueprint />;
}
