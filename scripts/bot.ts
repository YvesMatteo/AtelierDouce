import { supabase } from '@/lib/supabase';
// import { placeOrder } from '@/lib/automation';

// Poll for PAID orders and process them
async function runBot() {
  console.log('Bot started. Monitoring for PAID orders...');

  setInterval(async () => {
    // 1. Fetch pending orders
    /*
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'PAID')
      .limit(1);
 
    if (orders && orders.length > 0) {
      const order = orders[0];
      console.log(`Processing order ${order.id}...`);
 
      try {
        // 2. Trigger Puppeteer
        await placeOrder({
           productUrl: 'https://aliexpress.com/item/example...',
           sku: 'Default',
           shippingAddress: order.shipping_details.address
        });
        
        // 3. Update status
        await supabase.from('orders').update({ status: 'FULFILLED' }).eq('id', order.id);
        console.log(`Order ${order.id} fulfilled!`);
        
      } catch (err) {
        console.error(`Failed to process order ${order.id}:`, err);
        // Mark as failed so we don't retry infinitely immediately
        await supabase.from('orders').update({ status: 'FAILED' }).eq('id', order.id);
      }
    }
    */
    console.log('Checking...');
  }, 10000); // Check every 10 seconds
}

// To run this: ts-node scripts/bot.ts (requires ts-node)
// or just export it and run via a custom Next.js script
console.log('To run this bot, you need valid DB keys. Uncomment logic in scripts/bot.ts when ready.');
