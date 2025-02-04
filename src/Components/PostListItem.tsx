import { Text, View, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import { AdvancedImage } from 'cloudinary-react-native';
import { thumbnail } from "@cloudinary/url-gen/actions/resize";
import { byRadius } from "@cloudinary/url-gen/actions/roundCorners";
import { focusOn } from "@cloudinary/url-gen/qualifiers/gravity";
import { FocusOn } from "@cloudinary/url-gen/qualifiers/focusOn";
import { cld } from '~/src/lib/cloudinary';

export default function PostListItem({ post }) {

    const { width } = useWindowDimensions();
    console.log(width)
    // Post image
    const image = cld.image(post.image);
    image.resize(thumbnail().width(500).height(500));

    // Avatar image
    const avatarImage = cld.image(post.user.avatar_url);
    avatarImage.resize(thumbnail().width(48).height(48).gravity(focusOn(FocusOn.face()))).roundCorners(byRadius(50));

    return (
        <View style={{ backgroundColor: 'white' }}>
            {/* Header */}
            <View style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <AdvancedImage cldImg={avatarImage} style={{ width: 48, height: 48, borderRadius: 24 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: 'gray' }}>
                    {post.user.username}
                </Text>
            </View>

            {/* Post Image */}
            <AdvancedImage cldImg={image} style={{ width: '100%', aspectRatio: 4 / 3 }} />

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 12, padding: 10 }}>
                <TouchableOpacity>
                    <AntDesign name="hearto" size={20} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="chatbubble-outline" size={20} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Feather name="send" size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={{ marginLeft: 'auto' }}>
                    <Feather name="bookmark" size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
