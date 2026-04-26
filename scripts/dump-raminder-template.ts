/**
 * Prints the JSON documents + defaults for Raminder's seeded template.
 * Used once to feed the rp_lease_templates row via SQL.
 *
 * Usage:  npx tsx scripts/dump-raminder-template.ts > /tmp/raminder-template.json
 */

import {
  buildRaminderTemplateDocuments,
  RAMINDER_TEMPLATE_DEFAULTS,
  RAMINDER_TEMPLATE_NAME,
  RAMINDER_TEMPLATE_DESCRIPTION,
} from "../src/lib/lease-templates/raminder-ab-furnished";

const payload = {
  name: RAMINDER_TEMPLATE_NAME,
  description: RAMINDER_TEMPLATE_DESCRIPTION,
  defaults: RAMINDER_TEMPLATE_DEFAULTS,
  documents: buildRaminderTemplateDocuments(),
};

process.stdout.write(JSON.stringify(payload));
