import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:5000";

function App() {
  const [page, setPage] = useState("landing");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("dietPlannerUser") || "null")
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [profile, setProfile] = useState({
    name: "",
    age: "",
    sex: "male",
    height_cm: "",
    weight_kg: "",
    activity_level: "moderate",
    goal: "maintain",
    diet_pref: "balanced",
    allergies: "",
    cuisines: "",
    budget_per_day: "",
    timeline_weeks: "",
  });

  const [plan, setPlan] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage("Registration successful. Please login.");
      setPage("login");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("dietPlannerToken", data.user.idToken);
      localStorage.setItem("dietPlannerUser", JSON.stringify(data.user));

      setUser(data.user);

      const token = data.user.idToken;

      const [profileResponse, plansResponse] = await Promise.all([
        fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const saved = profileData.profile || profileData.data || {};

        setProfile({
          name: saved.name || data.user.email?.split("@")[0] || "",
          age: saved.age ?? "",
          sex: saved.sex || "male",
          height_cm: saved.height_cm ?? "",
          weight_kg: saved.weight_kg ?? "",
          activity_level: saved.activity_level || "moderate",
          goal: saved.goal || "maintain",
          diet_pref: saved.diet_pref || "balanced",
          allergies: Array.isArray(saved.allergies) ? saved.allergies.join(", ") : saved.allergies || "",
          cuisines: Array.isArray(saved.cuisines) ? saved.cuisines.join(", ") : saved.cuisines || "",
          budget_per_day: saved.budget_per_day ?? "",
          timeline_weeks: saved.timeline_weeks ?? "",
        });
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        const mapped = (plansData.plans || []).map((p) => ({
          ...p,
          calories: p.total_cal ?? p.calories ?? 0,
          protein: p.macros?.p ?? p.protein ?? 0,
          carbs: p.macros?.c ?? p.carbs ?? 0,
          fat: p.macros?.f ?? p.fat ?? 0,
          goal: p.goal || p.profile_snapshot?.goal || p.profile?.goal || "",
          diet: p.diet || p.diet_pref || p.profile_snapshot?.diet_pref || p.profile?.diet_pref || "",
          diet_pref: p.diet_pref || p.diet || p.profile_snapshot?.diet_pref || "",
          days: p.days || [],
        }));

        setSavedPlans(mapped);
      }

      setPlan(null);
      setPage("dashboard");
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("dietPlannerToken");
    localStorage.removeItem("dietPlannerUser");
    setUser(null);
    setProfile({
      name: "", age: "", sex: "male", height_cm: "", weight_kg: "",
      activity_level: "moderate", goal: "maintain", diet_pref: "balanced",
      allergies: "", cuisines: "", budget_per_day: "", timeline_weeks: ""
    });
    setSavedPlans([]);
    setPlan(null);
    setPage("landing");
  };

  const openProfile = () => {
    setProfile({
      ...profile,
      name: user?.email?.split("@")[0] || "",
    });
    setPage("profile");
  };

  const [savedPlans, setSavedPlans] = useState([]);

  const getToken = () =>
    localStorage.getItem("dietPlannerToken");

  useEffect(() => {
    const token = localStorage.getItem("dietPlannerToken");
    if (!token) return;

    const loadUserData = async () => {
      try {
        const profileResponse = await fetch(`${API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const saved = profileData.profile || profileData.data || {};

          setProfile((current) => ({
            ...current,
            ...saved,
            allergies: Array.isArray(saved.allergies)
              ? saved.allergies.join(", ")
              : saved.allergies || "",
            cuisines: Array.isArray(saved.cuisines)
              ? saved.cuisines.join(", ")
              : saved.cuisines || "",
          }));
        }

        const plansResponse = await fetch(`${API_URL}/api/plans`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (plansResponse.ok) {
          const plansData = await plansResponse.json();

          const mapped = (plansData.plans || []).map((p) => ({
            ...p,
            calories: p.total_cal ?? p.calories ?? 0,
            protein: p.macros?.p ?? p.protein ?? 0,
            carbs: p.macros?.c ?? p.carbs ?? 0,
            fat: p.macros?.f ?? p.fat ?? 0,
            goal:
              p.goal ||
              p.profile_snapshot?.goal ||
              p.profile?.goal ||
              "",
            diet:
              p.diet ||
              p.diet_pref ||
              p.profile_snapshot?.diet_pref ||
              p.profile?.diet_pref ||
              "",
            diet_pref:
              p.diet_pref ||
              p.diet ||
              p.profile_snapshot?.diet_pref ||
              "",
            days: p.days || [],
          }));

          setSavedPlans(mapped);
        }
      } catch (error) {
        console.error("User data restore error:", error);
      }
    };

    loadUserData();
  }, [user?.localId]);

  const calculatePreview = async () => {
    const token = getToken();

    if (!token) {
      setMessage("Please login again.");
      setPage("login");
      return;
    }

    const required = [
      "age",
      "sex",
      "height_cm",
      "weight_kg",
    ];

    const missing = required.filter(
      (field) =>
        profile[field] === "" ||
        profile[field] === null ||
        profile[field] === undefined
    );

    if (missing.length > 0) {
      setMessage("Please complete your profile first.");
      setPage("profile");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...profile,

        age: Number(profile.age),
        height_cm: Number(profile.height_cm),
        weight_kg: Number(profile.weight_kg),

        budget_per_day:
          profile.budget_per_day === ""
            ? null
            : Number(profile.budget_per_day),

        timeline_weeks:
          profile.timeline_weeks === ""
            ? null
            : Number(profile.timeline_weeks),

        allergies: Array.isArray(profile.allergies)
          ? profile.allergies
          : String(profile.allergies || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),

        cuisines: Array.isArray(profile.cuisines)
          ? profile.cuisines
          : String(profile.cuisines || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
      };

      const response = await fetch(
        `${API_URL}/api/generate-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          data.message ||
          "Diet plan generation failed"
        );
      }

      const p = data.plan;

      const generatedPlan = {
        ...p,

        id: p.id,
        createdAt: p.createdAt,

        calories:
          p.daily_calories ??
          p.total_cal ??
          p.calories ??
          0,

        total_cal:
          p.daily_calories ??
          p.total_cal ??
          p.calories ??
          0,

        protein:
          p.macros?.p ??
          p.protein ??
          0,

        carbs:
          p.macros?.c ??
          p.carbs ??
          0,

        fat:
          p.macros?.f ??
          p.fat ??
          0,

        macros: p.macros || {
          p: 0,
          c: 0,
          f: 0,
        },

        goal: profile.goal,
        diet: profile.diet_pref,

        days: p.days || [],
      };

      setPlan(generatedPlan);

      setSavedPlans((current) => [
        generatedPlan,
        ...current.filter(
          (item) => item.id !== generatedPlan.id
        ),
      ]);

      setPage("plan-result");

    } catch (error) {
      console.error(error);
      setMessage(
        error.message ||
        "Unable to generate diet plan."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPlans = async () => {
    const token = getToken();

    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/plans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          data.message ||
          "Unable to load saved plans"
        );
      }

      const mapped = (data.plans || []).map(
        (p) => ({
          ...p,

          calories:
            p.daily_calories ??
            p.total_cal ??
            p.calories ??
            0,

          protein:
            p.macros?.p ??
            p.protein ??
            0,

          carbs:
            p.macros?.c ??
            p.carbs ??
            0,

          fat:
            p.macros?.f ??
            p.fat ??
            0,

          goal:
            p.profile_snapshot?.goal ??
            profile.goal,

          diet:
            p.profile_snapshot?.diet_pref ??
            profile.diet_pref,

          days: p.days || [],
        })
      );

      setSavedPlans(mapped);

    } catch (error) {
      console.error(
        "Saved plans error:",
        error
      );
    }
  };

  const deleteSavedPlan = async (id) => {
    console.log("DELETE CLICKED ID:", id);
    const token = getToken();

    if (!token || !id) return;

    try {
      const response = await fetch(
        `${API_URL}/api/plans/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          data.message ||
          "Unable to delete plan"
        );
      }

      setSavedPlans((current) =>
        current.filter(
          (p) => p.id !== id
        )
      );

    } catch (error) {
      setMessage(
        error.message ||
        "Unable to delete plan."
      );
    }
  };

  if (page === "dashboard") {
    return (
      <Dashboard
        user={user}
        openProfile={openProfile}
        setPage={setPage}
        logout={logout}
        savedPlans={savedPlans}
      />
    );
  }

  if (page === "profile") {
    return (
      <Profile
        profile={profile}
        handleProfileChange={handleProfileChange}
        setPage={setPage}
        setMessage={setMessage}
        message={message}
      />
    );
  }

  if (page === "generate") {
    return (
      <GeneratePlan
        profile={profile}
        handleProfileChange={handleProfileChange}
        calculatePreview={calculatePreview}
        setPage={setPage}
        message={message}
      />
    );
  }

  if (page === "plan-result") {
    return (
      <PlanResult
        plan={plan}
        setPage={setPage}
      />
    );
  }

  if (page === "saved") {
    return (
      <SavedPlans
        setPage={setPage}
        plans={savedPlans}
        setSelectedPlan={setPlan}
        deleteSavedPlan={deleteSavedPlan}
      />
    );
  }

  if (page === "files") {
    return <CloudFiles setPage={setPage} />;
  }

  if (page === "intake") {
    return (
      <DailyTracker
        setPage={setPage}
        getToken={getToken}
      />
    );
  }

  if (page === "register" || page === "login") {
    const isRegister = page === "register";

    return (
      <div className="auth-page">
        <div className="auth-card">
          <button
            className="back-button"
            onClick={() => {
              setPage("landing");
              setMessage("");
            }}
          >
            Back to home
          </button>

          <div className="auth-logo">D</div>

          <p className="eyebrow">
            {isRegister ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </p>

          <h1>
            {isRegister ? "Start your nutrition journey" : "Sign in to DietAI"}
          </h1>

          <p className="auth-subtitle">
            {isRegister
              ? "Create your account to build personalized diet plans."
              : "Access your personalized nutrition dashboard."}
          </p>

          <form onSubmit={isRegister ? register : login}>
            {isRegister && (
              <label>
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
              />
            </label>

            {message && <div className="error-message">{message}</div>}

            <button className="primary-button auth-submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Login"}
            </button>
          </form>

          <div className="auth-switch">
            {isRegister ? (
              <>
                Already have an account?
                <button onClick={() => setPage("login")}>Login</button>
              </>
            ) : (
              <>
                New to DietAI?
                <button onClick={() => setPage("register")}>
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <strong>DietAI</strong>
            <span>Personal Planner</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={() => setPage("login")}>
            Sign in
          </button>

          <button className="primary-button" onClick={() => setPage("register")}>
            Create your plan
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <p className="eyebrow">AI-POWERED NUTRITION</p>

            <h1>
              Your personal diet plan,
              <span> intelligently created.</span>
            </h1>

            <p className="hero-text">
              DietAI combines your goals, body metrics, activity level and food
              preferences to create personalized nutrition plans and track your
              progress securely in the cloud.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button large-button"
                onClick={() => setPage("register")}
              >
                Create your plan
              </button>

              <button
                className="secondary-button large-button"
                onClick={() => setPage("login")}
              >
                Sign in
              </button>
            </div>

            <div className="trust-row">
              <div>
                <strong>AI</strong>
                <span>Personalized plans</span>
              </div>

              <div>
                <strong>Cloud</strong>
                <span>Secure storage</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>Progress tracking</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <span>Today's nutrition</span>
                <span className="preview-dot"></span>
              </div>

              <div className="calorie-ring">
                <strong>1,842</strong>
                <span>kcal target</span>
              </div>

              <div className="macro-bars">
                <div>
                  <span>Protein</span>
                  <strong>30%</strong>
                </div>

                <div>
                  <span>Carbs</span>
                  <strong>40%</strong>
                </div>

                <div>
                  <span>Fat</span>
                  <strong>30%</strong>
                </div>
              </div>

              <div className="preview-meal">
                <div className="meal-icon">B</div>
                <div>
                  <strong>Breakfast</strong>
                  <span>Balanced meal</span>
                </div>
                <b>420 kcal</b>
              </div>

              <div className="preview-meal">
                <div className="meal-icon">L</div>
                <div>
                  <strong>Lunch</strong>
                  <span>Protein focused</span>
                </div>
                <b>610 kcal</b>
              </div>
            </div>

            <div className="floating-chip chip-one">
              <span>OK</span> Goal on track
            </div>

            <div className="floating-chip chip-two">
              <span>AI</span> AI plan ready
            </div>
          </div>
        </section>

        <section className="feature-strip">
          <div>
            <strong>Personalized AI Plans</strong>
            <span>Based on your profile and goals</span>
          </div>

          <div>
            <strong>Cloud Storage</strong>
            <span>Keep plans and files organized</span>
          </div>

          <div>
            <strong>Progress Dashboard</strong>
            <span>Track your nutrition journey</span>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard({
  user,
  openProfile,
  setPage,
  logout,
  savedPlans,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <strong>DietAI</strong>
            <span>Personal Planner</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item active"
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>

          <button className="nav-item" onClick={openProfile}>
            My Profile
          </button>

          <button
            className="nav-item"
            onClick={() => setPage("generate")}
          >
            Generate Plan
          </button>

          <button
            className="nav-item"
            onClick={() => setPage("saved")}
          >
            Saved Plans
          </button>

          <button className="nav-item" onClick={() => setPage("intake")}>
            Daily Tracker
          </button>
        </nav>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">PERSONAL DASHBOARD</p>
            <h1>Welcome back!</h1>
            <p className="muted">
              Your personalized nutrition journey starts here.
            </p>
          </div>

          <div className="user-badge">
            <div className="avatar">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
            <span>{user?.email || "User"}</span>
          </div>
        </header>

        <section className="dashboard-grid">
          <div className="dashboard-card hero-card">
            <div>
              <p className="card-label">CURRENT GOAL</p>
              <h2>Build your personalized plan</h2>
              <p>
                Complete your profile and generate a nutrition plan based on
                your body metrics, activity and goal.
              </p>

              <button
                className="primary-button"
                onClick={() => setPage("generate")}
              >
                Generate Diet Plan
              </button>
            </div>

            <div className="goal-visual">
              <div className="goal-circle">AI</div>
            </div>
          </div>

          <div className="dashboard-card stat-card">
            <span className="stat-icon">01</span>
            <p>Diet Preference</p>
            <strong>Personalized</strong>
            <small>Based on your profile</small>
          </div>

          <div className="dashboard-card stat-card">
            <span className="stat-icon">02</span>
            <p>Saved Plans</p>
            <strong>{savedPlans.length}</strong>
            <small>Generated plans</small>
          </div>

          <div className="dashboard-card stat-card">
            <span className="stat-icon">03</span>
            <p>Cloud Files</p>
            <strong>0 files</strong>
            <small>Your uploaded files</small>
          </div>
        </section>

        <section className="dashboard-card quick-card">
          <div>
            <p className="card-label">QUICK ACTIONS</p>
            <h2>Manage your nutrition</h2>
            <p className="muted">
              Create plans, review saved plans and manage your cloud files.
            </p>
          </div>

          <div className="quick-actions">
            <button onClick={openProfile}>My Profile</button>
            <button onClick={() => setPage("generate")}>
              Generate Plan
            </button>
            <button onClick={() => setPage("saved")}>
              Saved Plans
            </button>
            <button onClick={() => setPage("intake")}>
              Daily Tracker
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================
   DAILY INTAKE TRACKER
========================= */

function DailyTracker({ setPage, getToken }) {
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    meal: "Breakfast",
    food: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const loadIntake = async (selectedDate) => {
    const token = getToken();

    if (!token) {
      setMessage("Please login again.");
      setPage("login");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/intake/${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load intake.");
      }

      setItems(data?.intake?.items || []);
    } catch (error) {
      console.error("Load intake error:", error);
      setMessage(error.message || "Unable to load intake.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntake(date);
  }, [date]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addItem = () => {
    if (!form.food.trim()) {
      setMessage("Please enter a food item.");
      return;
    }

    const newItem = {
      meal: form.meal,
      food: form.food.trim(),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    };

    setItems((current) => [...current, newItem]);

    setForm({
      meal: form.meal,
      food: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });

    setMessage("");
  };

  const removeItem = (index) => {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const totals = items.reduce(
    (total, item) => ({
      calories: total.calories + Number(item.calories || 0),
      protein: total.protein + Number(item.protein || 0),
      carbs: total.carbs + Number(item.carbs || 0),
      fat: total.fat + Number(item.fat || 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );

  const saveIntake = async () => {
    const token = getToken();

    if (!token) {
      setMessage("Please login again.");
      setPage("login");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/intake/${date}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            items,
            totals,
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save intake.");
      }

      await loadIntake(date);

      setMessage("Daily intake saved successfully.");
    } catch (error) {
      console.error("Save intake error:", error);
      setMessage(error.message || "Unable to save intake.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page profile-page">
      <div className="profile-container">
        <div className="profile-top">
          <button
            className="back-button"
            onClick={() => setPage("dashboard")}
          >
            Back to Dashboard
          </button>

          <div className="profile-heading">
            <p className="eyebrow">DAILY TRACKER</p>
            <h1>Track your daily nutrition</h1>
            <p>
              Record your meals and monitor your daily calories and macros.
            </p>
          </div>
        </div>

        <div className="profile-card">
          <div className="form-section">
            <h2>Select Date</h2>

            <div className="form-grid">
              <label>
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card stat-card">
              <span className="stat-icon">K</span>
              <p>Calories</p>
              <strong>{Math.round(totals.calories)} kcal</strong>
              <small>Today's intake</small>
            </div>

            <div className="dashboard-card stat-card">
              <span className="stat-icon">P</span>
              <p>Protein</p>
              <strong>{Math.round(totals.protein)} g</strong>
              <small>Today's intake</small>
            </div>

            <div className="dashboard-card stat-card">
              <span className="stat-icon">C</span>
              <p>Carbs</p>
              <strong>{Math.round(totals.carbs)} g</strong>
              <small>Today's intake</small>
            </div>

            <div className="dashboard-card stat-card">
              <span className="stat-icon">F</span>
              <p>Fat</p>
              <strong>{Math.round(totals.fat)} g</strong>
              <small>Today's intake</small>
            </div>
          </div>

          <div className="form-section">
            <h2>Add Meal</h2>

            <div className="form-grid">
              <label>
                Meal Type
                <select
                  name="meal"
                  value={form.meal}
                  onChange={handleChange}
                >
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Snack</option>
                  <option>Dinner</option>
                </select>
              </label>

              <label>
                Food Item
                <input
                  name="food"
                  value={form.food}
                  onChange={handleChange}
                  placeholder="Example: Oats Banana Bowl"
                />
              </label>

              <label>
                Calories
                <input
                  name="calories"
                  type="number"
                  min="0"
                  value={form.calories}
                  onChange={handleChange}
                  placeholder="Calories"
                />
              </label>

              <label>
                Protein (g)
                <input
                  name="protein"
                  type="number"
                  min="0"
                  value={form.protein}
                  onChange={handleChange}
                  placeholder="Protein"
                />
              </label>

              <label>
                Carbs (g)
                <input
                  name="carbs"
                  type="number"
                  min="0"
                  value={form.carbs}
                  onChange={handleChange}
                  placeholder="Carbs"
                />
              </label>

              <label>
                Fat (g)
                <input
                  name="fat"
                  type="number"
                  min="0"
                  value={form.fat}
                  onChange={handleChange}
                  placeholder="Fat"
                />
              </label>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="primary-button"
                onClick={addItem}
              >
                Add Meal
              </button>
            </div>
          </div>

          <div className="form-section">
            <h2>Today's Meals</h2>

            {items.length === 0 ? (
              <p className="muted">
                No meals recorded for this date.
              </p>
            ) : (
              items.map((item, index) => (
                <div
                  className="preview-meal"
                  key={`${item.food}-${index}`}
                >
                  <div className="meal-icon">
                    {(item.meal || "M").charAt(0)}
                  </div>

                  <div>
                    <strong>{item.meal}</strong>
                    <span>{item.food}</span>
                  </div>

                  <b>{item.calories} kcal</b>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {message && <div className="success-message">{message}</div>}

          <div className="profile-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPage("dashboard")}
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={saveIntake}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Daily Intake"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   PROFILE
========================= */

function Profile({
  profile,
  handleProfileChange,
  setPage,
  setMessage,
  message,
}) {
  return (
    <div className="auth-page profile-page">
      <div className="profile-container">
        <div className="profile-top">
          <button
            className="back-button"
            onClick={() => setPage("dashboard")}
          >
            Back to Dashboard
          </button>

          <div className="profile-heading">
            <p className="eyebrow">YOUR PROFILE</p>
            <h1>Build your nutrition profile</h1>
            <p>
              Add your body details, activity level, goals and dietary
              preferences.
            </p>
          </div>
        </div>

        <form
          className="profile-card"
          onSubmit={async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("dietPlannerToken");
    const currentUser = JSON.parse(
      localStorage.getItem("dietPlannerUser") || "null"
    );

    if (!token || !currentUser?.localId) {
      setMessage("Please login again before saving your profile.");
      return;
    }
    const profileData = {
      name: profile.name,
      age: Number(profile.age),
      sex: profile.sex,
      height_cm: Number(profile.height_cm),
      weight_kg: Number(profile.weight_kg),
      activity_level: profile.activity_level,
      goal: profile.goal,
      diet_pref: profile.diet_pref,
      allergies: profile.allergies
        ? profile.allergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      cuisines: profile.cuisines
        ? profile.cuisines
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      budget_per_day: profile.budget_per_day
        ? Number(profile.budget_per_day)
        : 0,
      timeline_weeks: profile.timeline_weeks
        ? Number(profile.timeline_weeks)
        : 0,
    };

    const response = await fetch(`${API_URL}/api/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Failed to save profile.");
    }

    setMessage(
      data?.message || "Profile saved successfully to Firebase Cloud."
    );
  } catch (error) {
    console.error("Profile save error:", error);
    setMessage(error.message || "Failed to save profile.");
  }
}}
        >
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-grid">
              <label>
                Full Name
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your name"
                  required
                />
              </label>

              <label>
                Age
                <input
                  name="age"
                  type="number"
                  value={profile.age}
                  onChange={handleProfileChange}
                  placeholder="Age"
                  required
                />
              </label>

              <label>
                Sex
                <select
                  name="sex"
                  value={profile.sex}
                  onChange={handleProfileChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>

              <label>
                Height (cm)
                <input
                  name="height_cm"
                  type="number"
                  value={profile.height_cm}
                  onChange={handleProfileChange}
                  placeholder="Height"
                  required
                />
              </label>

              <label>
                Weight (kg)
                <input
                  name="weight_kg"
                  type="number"
                  value={profile.weight_kg}
                  onChange={handleProfileChange}
                  placeholder="Weight"
                  required
                />
              </label>

              <label>
                Activity Level
                <select
                  name="activity_level"
                  value={profile.activity_level}
                  onChange={handleProfileChange}
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Nutrition Goal</h2>

            <div className="form-grid">
              <label>
                Goal
                <select
                  name="goal"
                  value={profile.goal}
                  onChange={handleProfileChange}
                >
                  <option value="cut">Weight Loss</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Weight Gain</option>
                </select>
              </label>

              <label>
                Diet Preference
                <select
                  name="diet_pref"
                  value={profile.diet_pref}
                  onChange={handleProfileChange}
                >
                  <option value="balanced">Balanced</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="non-vegetarian">Non-Vegetarian</option>
                </select>
              </label>

              <label>
                Budget Per Day
                <input
                  name="budget_per_day"
                  type="number"
                  value={profile.budget_per_day}
                  onChange={handleProfileChange}
                  placeholder="Budget"
                />
              </label>

              <label>
                Timeline (weeks)
                <input
                  name="timeline_weeks"
                  type="number"
                  value={profile.timeline_weeks}
                  onChange={handleProfileChange}
                  placeholder="Weeks"
                />
              </label>

              <label className="full-width">
                Allergies
                <input
                  name="allergies"
                  value={profile.allergies}
                  onChange={handleProfileChange}
                  placeholder="Example: peanuts, dairy"
                />
              </label>

              <label className="full-width">
                Preferred Cuisines
                <input
                  name="cuisines"
                  value={profile.cuisines}
                  onChange={handleProfileChange}
                  placeholder="Example: Indian, South Indian"
                />
              </label>
            </div>
          </div>

          {message && <div className="success-message">{message}</div>}

          <div className="profile-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPage("dashboard")}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   GENERATE PLAN
========================= */

function GeneratePlan({
  profile,
  handleProfileChange,
  calculatePreview,
  setPage,
  message,
}) {
  return (
    <div className="auth-page profile-page">
      <div className="profile-container">
        <div className="profile-top">
          <button
            className="back-button"
            onClick={() => setPage("dashboard")}
          >
            Back to Dashboard
          </button>

          <div className="profile-heading">
            <p className="eyebrow">AI DIET PLANNER</p>
            <h1>Generate your personalized plan</h1>
            <p>
              Enter your details and DietAI will calculate your daily
              nutrition target.
            </p>
          </div>
        </div>

        <div className="profile-card">
          <div className="form-section">
            <h2>Plan Inputs</h2>

            <div className="form-grid">
              <label>
                Age
                <input
                  name="age"
                  type="number"
                  value={profile.age}
                  onChange={handleProfileChange}
                  placeholder="Age"
                />
              </label>

              <label>
                Sex
                <select
                  name="sex"
                  value={profile.sex}
                  onChange={handleProfileChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>

              <label>
                Height (cm)
                <input
                  name="height_cm"
                  type="number"
                  value={profile.height_cm}
                  onChange={handleProfileChange}
                  placeholder="Height"
                />
              </label>

              <label>
                Weight (kg)
                <input
                  name="weight_kg"
                  type="number"
                  value={profile.weight_kg}
                  onChange={handleProfileChange}
                  placeholder="Weight"
                />
              </label>

              <label>
                Activity Level
                <select
                  name="activity_level"
                  value={profile.activity_level}
                  onChange={handleProfileChange}
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                </select>
              </label>

              <label>
                Goal
                <select
                  name="goal"
                  value={profile.goal}
                  onChange={handleProfileChange}
                >
                  <option value="cut">Weight Loss</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Weight Gain</option>
                </select>
              </label>

              <label>
                Diet Preference
                <select
                  name="diet_pref"
                  value={profile.diet_pref}
                  onChange={handleProfileChange}
                >
                  <option value="balanced">Balanced</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="non-vegetarian">Non-Vegetarian</option>
                </select>
              </label>

              <label>
                Timeline (weeks)
                <input
                  name="timeline_weeks"
                  type="number"
                  value={profile.timeline_weeks}
                  onChange={handleProfileChange}
                  placeholder="Weeks"
                />
              </label>

              <label className="full-width">
                Allergies
                <input
                  name="allergies"
                  value={profile.allergies}
                  onChange={handleProfileChange}
                  placeholder="Example: peanuts, dairy"
                />
              </label>

              <label className="full-width">
                Preferred Cuisines
                <input
                  name="cuisines"
                  value={profile.cuisines}
                  onChange={handleProfileChange}
                  placeholder="Example: Indian, South Indian"
                />
              </label>
            </div>
          </div>

          {message && <div className="error-message">{message}</div>}

          <div className="profile-actions">
            <button
              className="secondary-button"
              onClick={() => setPage("profile")}
            >
              Edit Profile
            </button>

            <button
              className="primary-button"
              onClick={calculatePreview}
            >
              Generate AI Diet Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   PLAN RESULT
========================= */

function PlanResult({ plan, setPage }) {
  if (!plan) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>No plan found</h1>
          <button
            className="primary-button"
            onClick={() => setPage("generate")}
          >
            Generate Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page profile-page">
      <div className="profile-container">
        <div className="profile-top">
          <button
            className="back-button"
            onClick={() => setPage("dashboard")}
          >
            Back to Dashboard
          </button>

          <div className="profile-heading">
            <p className="eyebrow">PLAN RESULT</p>
            <h1>Your personalized diet plan</h1>
            <p>
              Generated based on your current profile and nutrition goal.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card stat-card">
            <span className="stat-icon">K</span>
            <p>Daily Calories</p>
            <strong>{plan.calories} kcal</strong>
            <small>Target</small>
          </div>

          <div className="dashboard-card stat-card">
            <span className="stat-icon">P</span>
            <p>Protein</p>
            <strong>{plan.protein} g</strong>
            <small>30 percent</small>
          </div>

          <div className="dashboard-card stat-card">
            <span className="stat-icon">C</span>
            <p>Carbohydrates</p>
            <strong>{plan.carbs} g</strong>
            <small>40 percent</small>
          </div>

          <div className="dashboard-card stat-card">
            <span className="stat-icon">F</span>
            <p>Fat</p>
            <strong>{plan.fat} g</strong>
            <small>30 percent</small>
          </div>
        </div>

        <div className="profile-card" style={{ marginTop: "20px" }}>
          {plan.days.map((day) => (
            <div className="form-section" key={day.day}>
              <h2>Day {day.day}</h2>

              {day.meals.map((meal, index) => (
                <div
                  className="preview-meal"
                  key={`${day.day}-${meal.name}-${index}`}
                >
                  <div className="meal-icon">
                    {(meal.meal || meal.name || "M").charAt(0)}
                  </div>

                  <div>
                    <strong>{meal.meal || "Meal"}</strong>
                    <span>{meal.name || meal.food || "Meal"}</span>
                  </div>

                  <b>{meal.calories} kcal</b>
                </div>
              ))}
            </div>
          ))}

          <div className="profile-actions">
            <button
              className="secondary-button"
              onClick={() => setPage("saved")}
            >
              View Saved Plans
            </button>

            <button
              className="primary-button"
              onClick={() => setPage("generate")}
            >
              Generate New Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SAVED PLANS
========================= */

function SavedPlans({ plans, setPage, setSelectedPlan, deleteSavedPlan }) {
  const formatGoal = (goal) => {
    const value = String(goal || "").trim().toLowerCase();
    if (["cut", "loss", "lose", "weight_loss", "weight loss"].includes(value)) return "Weight Loss";
    if (["gain", "weight_gain", "weight gain"].includes(value)) return "Weight Gain";
    if (["maintain", "maintenance", "maintain weight"].includes(value)) return "Maintain Weight";
    return goal || "Personalized";
  };

  const formatDiet = (diet) => {
    const value = String(diet || "").trim().toLowerCase();
    if (["non-vegetarian", "non vegetarian", "nonveg"].includes(value)) return "Non-Vegetarian";
    if (["vegetarian", "veg"].includes(value)) return "Vegetarian";
    if (value === "vegan") return "Vegan";
    if (value === "balanced") return "Balanced";
    return diet || "Personalized";
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="page-shell">
        <button className="back-link" onClick={() => setPage("dashboard")}>
          Back to Dashboard
        </button>
        <div className="section-kicker">PLAN HISTORY</div>
        <h1>Saved Plans</h1>
        <p className="section-subtitle">Review your previously generated personalized diet plans.</p>
        <div className="profile-card" style={{ marginTop: "20px" }}>
          <p>No saved plans yet.</p>
          <button className="primary-button" onClick={() => setPage("generate")}>
            Generate Your First Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <button className="back-link" onClick={() => setPage("dashboard")}>
        Back to Dashboard
      </button>

      <div className="section-kicker">PLAN HISTORY</div>
      <h1>Saved Plans</h1>
      <p className="section-subtitle">Review your previously generated personalized diet plans.</p>

      <div className="plans-grid" style={{ marginTop: "20px" }}>
        {plans.map((plan) => {
          const goal = formatGoal(
            plan.goal ||
            plan.profile_snapshot?.goal ||
            plan.profile?.goal ||
            ""
          );

          const diet = formatDiet(
            plan.diet ||
            plan.diet_pref ||
            plan.profile_snapshot?.diet_pref ||
            plan.profile?.diet_pref ||
            ""
          );

          return (
            <div className="plan-card" key={plan.id}>
              <div className="plan-card-top">
                <span className="plan-label">DIET PLAN</span>
                <span className="plan-date">
                  {plan.createdAt || plan.created_at || ""}
                </span>
              </div>

              <h2>{plan.daily_calories || plan.calories || 0} kcal / day</h2>

              <div className="plan-meta">
                <div>Goal: {goal}</div>
                <div>Diet: {diet}</div>
              </div>

              <div className="macro-row">
                <span>Protein {plan.macros?.p ?? plan.protein ?? 0}g</span>
                <span>Carbs {plan.macros?.c ?? plan.carbs ?? 0}g</span>
                <span>Fat {plan.macros?.f ?? plan.fat ?? 0}g</span>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setSelectedPlan(plan);
                  setPage("plan-result");
                }}
              >
                View Plan
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default App;






















