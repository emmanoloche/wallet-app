import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { styles } from "@/assets/styles/auth.styles.js";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const isFetching = fetchStatus === "fetching";
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [emailExists, setEmailExists] = useState(false);

  // Send the user back to sign in with their email already filled in
  const goToSignIn = () => {
    router.dismissTo({ pathname: "/sign-in", params: { email: emailAddress } });
  };

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    setError("");
    setEmailExists(false);

    // Start sign-up process using email and password provided
    const { error: signUpError } = await signUp.password({
      emailAddress,
      password,
    });
    if (signUpError) {
      if (signUpError.errors?.[0]?.code === "form_identifier_exists") {
        setEmailExists(true);
        setError("An account with this email already exists. Sign in instead.");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.log(JSON.stringify(signUpError, null, 2));
      return;
    }

    // Send user an email with verification code
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setError("We couldn't send the verification code. Please try again.");
      console.log(JSON.stringify(sendError, null, 2));
      return;
    }

    // Set 'pendingVerification' to true to display second form
    // and capture OTP code
    setPendingVerification(true);
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    setError("");

    // Use the code the user provided to attempt verification
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({
      code,
    });
    if (verifyError) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      setError("That code is incorrect or has expired. Please try again.");
      console.log(JSON.stringify(verifyError, null, 2));
      return;
    }

    // If verification was completed, set the session to active
    // and redirect the user
    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize({
        navigate: ({ session }) => {
          // User still has a pending session task to complete
          if (session?.currentTask) {
            console.log(session.currentTask);
            return;
          }
          router.replace("/");
        },
      });
      if (finalizeError) {
        setError("An error occurred. Please try again.");
        console.log(JSON.stringify(finalizeError, null, 2));
      }
    } else {
      // If the status is not complete, check why. User may need to
      // complete further steps.
      console.error("Sign-up attempt not complete:", signUp.status);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>Verify your email</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={[styles.verificationInput, error && styles.errorInput]}
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor="#9A8478"
          onChangeText={(code) => setCode(code)}
        />

        <TouchableOpacity onPress={onVerifyPress} style={styles.button} disabled={isFetching}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
    >
      <View style={styles.container}>
        <Image source={require("../../../assets/images/revenue-i2.png")} style={styles.illustration} />

        <Text style={styles.title}>Create Account</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            {emailExists ? (
              <TouchableOpacity onPress={goToSignIn}>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          autoCapitalize="none"
          keyboardType="email-address"
          value={emailAddress}
          placeholderTextColor="#9A8478"
          placeholder="Enter email"
          onChangeText={(email) => {
            setEmailAddress(email);
            setEmailExists(false);
          }}
        />

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={password}
          placeholder="Enter password"
          placeholderTextColor="#9A8478"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />

        <TouchableOpacity style={styles.button} onPress={onSignUpPress} disabled={isFetching}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
