/** Resposta de GET /api/v1/me (campos principais). */
export type MeProfile = {
  bio: string | null;
  city: string | null;
  contact_info: string | null;
  skills: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  is_portfolio_public: boolean;
  is_published: boolean;
  avatar_s3_key: string | null;
  slug?: string;
};

export type Me = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  is_profile_complete: boolean;
  profile: MeProfile | null;
};
