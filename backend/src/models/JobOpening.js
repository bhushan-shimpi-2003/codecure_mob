const supabase = require('../config/supabaseClient');

/**
 * JobOpening Model — maps to `job_openings` table
 * Source: Career.tsx (title, company, location, salary, apply button)
 */

exports.getActiveJobOpenings = async () => {
  const { data, error } = await supabase
    .from('job_openings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.createJobOpening = async (jobData) => {
  const { data, error } = await supabase.from('job_openings').insert(jobData).select().single();
  if (error) throw error;
  return data;
};

exports.updateJobOpening = async (jobId, updates) => {
  const { data, error } = await supabase.from('job_openings').update(updates).eq('id', jobId).select().single();
  if (error) throw error;
  return data;
};

exports.deleteJobOpening = async (jobId) => {
  const { error } = await supabase.from('job_openings').delete().eq('id', jobId);
  if (error) throw error;
  return true;
};
