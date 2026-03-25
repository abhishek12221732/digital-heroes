import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the Service Role Key to bypass RLS and interact with Auth securely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch available charities to assign to users
    const { data: charities } = await supabaseAdmin.from('charities').select('id');
    if (!charities || charities.length === 0) {
      return NextResponse.json({ error: "Please add charities first!" }, { status: 400 });
    }

    const dummyUsers = [];

    // 2. Generate 5 Dummy Users
    for (let i = 1; i <= 5; i++) {
      const email = `testgolfer${i}@digitalheroes.com`;
      
      // Create the Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true
      });

      if (authError) {
        console.log(`Skipping ${email}:`, authError.message);
        continue; // Skip if user already exists
      }

      if (authData.user) {
        const userId = authData.user.id;
        const randomCharity = charities[Math.floor(Math.random() * charities.length)].id;

        // 3. Force their public profile to be an "active" subscriber (FIXED: Using upsert instead of update)
        const { error: insertError } = await supabaseAdmin.from('users').upsert({
          id: userId, // We must explicitly pass the ID we got from the Auth system
          sub_status: 'active',
          charity_id: randomCharity,
          charity_contribution_percent: 15
        });

        if (insertError) {
          console.error("Failed to insert public profile:", insertError);
          continue;
        }

        // 4. Generate 5 random scores (1-45) for this user
        const scoresToInsert = [];
        for (let s = 0; s < 5; s++) {
          // Intentionally weighting scores between 10-20 to test the algorithm
          const isWeighted = Math.random() > 0.5;
          const score = isWeighted 
            ? Math.floor(Math.random() * 11) + 10 // Range 10-20
            : Math.floor(Math.random() * 45) + 1; // Range 1-45
            
          scoresToInsert.push({
            user_id: userId,
            score: score,
            played_date: new Date(Date.now() - s * 86400000).toISOString().split('T')[0] // Past 5 days
          });
        }

        await supabaseAdmin.from('scores').insert(scoresToInsert);
        dummyUsers.push(email);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${dummyUsers.length} dummy users with active subscriptions and 5 scores each.`,
      users: dummyUsers 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}