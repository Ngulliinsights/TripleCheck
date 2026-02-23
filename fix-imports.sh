#!/bin/bash

# Fix toast imports - should be Toast not toast
sed -i "s/import { toast }/import { Toast as toast }/g" src/land-verification/pages/LandVerificationDashboardPage.tsx
sed -i "s/import { toast }/import { Toast as toast }/g" src/land-verification/pages/NewVerificationPage.tsx

# Fix useForm imports - export doesn't exist, comment out for now
sed -i "s/import { useForm }/\/\/ import { useForm }/g" src/shared/pages/Community.tsx
sed -i "s/import { useForm }/\/\/ import { useForm }/g" src/shared/pages/Contact.tsx
sed -i "s/import { useForm }/\/\/ import { useForm }/g" src/trust/pages/Alerts.tsx
sed -i "s/import { useForm }/\/\/ import { useForm }/g" src/trust/pages/Reviews.tsx

echo "Import fixes applied"
