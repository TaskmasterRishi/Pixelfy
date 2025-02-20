export interface User {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    full_name?: string;
    bio?: string;
}

export interface Post {
    id: string;
    user_id: string;
    image: string;
    caption?: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    profiles: {
        username: string;
        avatar_url: string | null;
    };
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string | null;
    };
} 