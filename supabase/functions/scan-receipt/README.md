# Receipt OCR Edge Function

This Supabase Edge Function scans a receipt with Google Vision and returns suggested transaction fields.

Privacy rule:
- It does **not** save the receipt photo.
- It does **not** write the photo to Supabase Storage, localStorage, IndexedDB, or your calendar JSON.
- The image is only held in request memory long enough to call Google Vision.

## Setup

```bash
supabase secrets set GOOGLE_VISION_API_KEY=YOUR_GOOGLE_VISION_API_KEY
supabase functions deploy scan-receipt
```

The frontend calls:

```js
supabaseClient.functions.invoke("scan-receipt", {
  body: { imageBase64, mimeType: "image/jpeg" }
});
```

## Google Cloud

Enable the Cloud Vision API in your Google Cloud project and create an API key. Restrict the key when possible.
