const supabase = require('../config/supabaseClient');

/**
 * ContactMessage Model — maps to `contact_messages` table
 * Source: Contact.tsx (name, email, message form)
 */

exports.createContactMessage = async (messageData) => {
  const { data, error } = await supabase.from('contact_messages').insert(messageData).select().single();
  if (error) throw error;
  return data;
};

exports.getAllContactMessages = async () => {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.markAsRead = async (messageId) => {
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
