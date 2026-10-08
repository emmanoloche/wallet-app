import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSignIn } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { styles } from "@/assets/styles/auth.styles.js";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const isFetching = fetchStatus === "fetching";
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [emailAddress, setEmailAddress] = useState(email ?? "");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // Prefill the email when redirected here from sign-up
  useEffect(() => {
    if (email) setEmailAddress(email);
  }, [email]);

  // Set the session to active and redirect the user
  const finalizeSignIn = async () => {
    const { error: finalizeError } = await signIn.finalize({
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
  };

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    setError("");

    // Start the sign-in process using the email and password provided
    const { error: signInError } = await signIn.password({
      emailAddress,
      password,
    });
    if (signInError) {
      const errorCode = signInError.errors?.[0]?.code;
      if (errorCode === "form_password_incorrect") {
        setError("Password is incorrect. Please try again.");
      } else if (errorCode === "form_identifier_not_found") {
        setError("We couldn't find an account with that email.");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.log(JSON.stringify(signInError, null, 2));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeSignIn();
    } else if (signIn.status === "needs_client_trust") {
      // Signing in from a new device, so Clerk asks for an emailed code
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (sendError) {
        setError("We couldn't send the verification code. Please try again.");
        console.log(JSON.stringify(sendError, null, 2));
        return;
      }
      setPendingVerification(true);
    } else {
      // If the status is not complete, check why. User may need to
      // complete further steps.
      setError("Sign in could not be completed. Please try again.");
      console.error("Sign-in attempt not complete:", signIn.status);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    setError("");

    const { error: verifyError } = await signIn.mfa.verifyEmailCode({ code });
    if (verifyError) {
      setError("That code is incorrect or has expired. Please try again.");
      console.log(JSON.stringify(verifyError, null, 2));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeSignIn();
    } else {
      setError("Sign in could not be completed. Please try again.");
      console.error("Sign-in attempt not complete:", signIn.status);
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
          keyboardType="number-pad"
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
      extraScrollHeight={30}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Image source={require("../../../assets/images/revenue-i4.png")} style={styles.illustration} />

        <Text style={styles.title}>Welcome Back</Text>

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
          style={[styles.input, error && styles.errorInput]}
          autoCapitalize="none"
          keyboardType="email-address"
          value={emailAddress}
          placeholderTextColor="#9A8478"
          placeholder="Enter email"
          onChangeText={(email) => setEmailAddress(email)}
        />

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={password}
          placeholder="Enter password"
          placeholderTextColor="#9A8478"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />

        <TouchableOpacity style={styles.button} onPress={onSignInPress} disabled={isFetching}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/sign-up")}>
            <Text style={styles.linkText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
