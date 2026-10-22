# Dalab Delivery

Moto delivery app between shops/markets and customers.
One code base for iPhone and Android (Expo + React Native + Supabase).

- Customer: browse shops, add to cart, drop a pin on the map, order, track the moto live.
- Rider: see new orders, accept, navigate, mark picked up / delivered. Live location goes to the customer.
- Payment: cash on delivery.

## 1. Database (Supabase)

1. (Already done: project "Dalab Delivery" is created and `supabase/schema.sql` is already applied.) Only repeat steps 1, 3 and 4 if you move to another Supabase project.
2. Authentication > Sign In / Providers > Email: turn OFF "Confirm email".
3. (Already applied. Only for a new project: SQL Editor > New query > paste `supabase/schema.sql` > Run.)
4. (Already done for you: the keys for the "Dalab Delivery" Supabase project are in `src/config.js`.)
   Never put the service_role key in the app.

## 2. Run on your phone

1. Install Node.js (LTS) from nodejs.org.
2. In this folder run: `npm install`
3. Run: `npx expo start`, then scan the QR code with the Expo Go app.

## 3. First shop and your rider

1. Create an account in the app (this is you).
2. Supabase > Table Editor > `profiles`: set your `role` to `admin`. Set your rider's `role` to `rider`.
3. Table Editor > `shops` > Insert row: name, category (Food, Supermarket, Electronics, Clothes, Stationery, Gas & Fuel, Other), latitude, longitude (long-press the shop on Google Maps to get them).
4. Table Editor > `products` > Insert row: shop_id (the shop's id), name, price.

## 4. Settings

`src/config.js`: app name, delivery fee, default map position, categories.

## 5. Publish

Before building, change `com.dalab.delivery` in `app.json` (ios.bundleIdentifier and android.package) to your own unique name. You cannot change it after publishing. Add a Google Maps API key in `app.json` and replace the pictures in `assets/` with the Dalab logo.

    npm install -g eas-cli
    eas login
    eas build:configure
    eas build -p android --profile preview      (APK to test on Android phones)
    eas build -p android --profile production   (Play Store)
    eas build -p ios --profile production       (App Store)

Google Play: $25 once. New personal accounts need about 12 testers for 14 days before going public.
Apple: $99 per year. Give Apple a test customer login and a test rider login. Both stores need a privacy policy link.

## Not in this first version

Push notifications, rider tracking with the screen locked, online payment, an admin website, road-distance fees.
