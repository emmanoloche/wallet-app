import { TouchableOpacity } from 'react-native'
import { useClerk } from '@clerk/expo'
import { Ionicons } from '@expo/vector-icons'
import { styles } from '../assets/styles/home.styles'
import { COLORS } from '../constants/colors'

const SignOutButton = () => {
  const { signOut } = useClerk();

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
      <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
    </TouchableOpacity>
  )
}

export default SignOutButton;
