import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Separator,
	toast,
	Link as UiLink,
} from '@full-stack-template/ui';
import {
	Computer,
	Moon,
	People,
	Sun,
	Upload,
	Zap,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import { type SubmitEvent, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import {
	errorCodes,
	isValidBetterAuthErrorCode,
	signUp,
	useClientSession,
} from '@/features/auth/auth.lib';
import {
	REGISTER_FORM_OPTIONS,
	useAppForm,
} from '@/features/auth/register/register.form';
import { m } from '@/features/i18n/paraglide/messages';
import { localizeHref } from '@/features/i18n/paraglide/runtime';

const FEATURES = [
	{
		icon: Computer,
		titleKey: 'sidePanelFeatureSecureTitle',
		descriptionKey: 'sidePanelFeatureSecureDescription',
	},
	{
		icon: Zap,
		titleKey: 'sidePanelFeatureFastTitle',
		descriptionKey: 'sidePanelFeatureFastDescription',
	},
	{
		icon: People,
		titleKey: 'sidePanelFeatureTeamsTitle',
		descriptionKey: 'sidePanelFeatureTeamsDescription',
	},
] as const;

export default function RegisterRoute() {
	const { theme, setTheme } = useTheme();
	const session = useClientSession();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	const registerForm = useAppForm({
		...REGISTER_FORM_OPTIONS,
		onSubmit: async ({ value }) => {
			const { name, email, password, image } = value;

			try {
				let imageUrl: string | undefined;
				if (image) {
					imageUrl = await new Promise<string>((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(reader.result as string);
						reader.onerror = reject;
						reader.readAsDataURL(image);
					});
				}

				const { data, error } = await signUp.email({
					name,
					email,
					password,
					image: imageUrl, // The image is sent as a base64 string.
					// TODO: The backend should handle the image upload and return
					// a URL, instead of returning the base64 string back to the frontend
				});

				if (!error) {
					toast.success(m.registerSuccess({ name: data.user.name }));
					return navigate(localizeHref('/'));
				}

				if (!isValidBetterAuthErrorCode(error.code)) {
					console.error('Unkown error at login', error);
					toast.error(`${m.loginFailed()}: ${error.code} - ${error.message}`);
					return;
				}

				if (error.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
					registerForm.setErrorMap({
						onSubmit: {
							fields: {
								email: {
									message: m.userAlreadyExistsUseAnotherEmail(),
								},
							},
						},
					});
				}

				const key = errorCodes[error.code];
				toast.error(m[key]());
			} catch (err) {
				console.error(m.registerErrorConsole(), err);
				toast.error(`${m.registerFailed()}: ${m.unknownError()}`);
			}
		},
	});

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await registerForm.handleSubmit();
		},
		[registerForm.handleSubmit],
	);

	return (
		<div className="min-h-dvh w-dvw max-w-full overflow-x-hidden lg:grid lg:grid-cols-2 bg-background">
			<div className="hidden lg:flex flex-col justify-between p-12 bg-muted/40 border-r border-border relative overflow-hidden">
				<div
					className="absolute inset-0 pointer-events-none select-none"
					aria-hidden
				>
					<div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-primary/8" />
					<div className="absolute top-1/2 -translate-y-1/2 -right-24 w-72 h-72 rounded-full bg-accent/15" />
					<div className="absolute bottom-24 left-1/3 w-52 h-52 rounded-full bg-primary/5" />
					<div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-accent/10" />
				</div>

				<div className="relative z-10 flex items-center gap-3">
					<div className="w-10 h-10 rounded-2xl bg-primary shadow-sm flex items-center justify-center">
						<span className="text-primary-foreground font-bold text-lg leading-none">
							A
						</span>
					</div>
					<span className="text-xl font-semibold tracking-tight">
						{m.sidePanelAppName()}
					</span>
				</div>

				<div className="relative z-10 space-y-10">
					<div>
						<h2 className="text-4xl font-bold tracking-tight leading-[1.15]">
							{m.sidePanelMainTitle()}
						</h2>
						<p className="mt-4 text-muted-foreground leading-relaxed max-w-xs">
							{m.sidePanelMainDescription()}
						</p>
					</div>

					<div className="space-y-5">
						{FEATURES.map((feature) => (
							<div key={feature.titleKey} className="flex items-start gap-4">
								<div className="size-10 rounded-xl bg-background border border-border shadow-xs flex items-center justify-center shrink-0 mt-0.5">
									<HugeiconsIcon
										icon={feature.icon}
										className="h-4 w-4 text-primary"
									/>
								</div>
								<div>
									<p className="text-sm font-medium leading-none">
										{m[feature.titleKey]()}
									</p>
									<p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
										{m[feature.descriptionKey]()}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<p className="relative z-10 text-xs text-muted-foreground">
					{m.sidePanelCopyright()}
				</p>
			</div>

			<div className="flex flex-col min-h-dvh lg:min-h-0">
				<div className="flex items-center justify-between px-6 py-4 lg:px-10">
					<p className="text-sm text-muted-foreground">
						{m.alreadyHaveAccount()}{' '}
						<UiLink render={<Link to={localizeHref('/auth/login')} />}>
							{m.loginHere()}
						</UiLink>
					</p>

					<DropdownMenu>
						<DropdownMenuTrigger
							render={<Button variant="outline" size="icon" />}
						>
							<HugeiconsIcon
								icon={
									theme === 'system' ? Computer : theme === 'light' ? Sun : Moon
								}
								className="h-4 w-4"
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuLabel>{m.selectTheme()}</DropdownMenuLabel>
								<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
									<DropdownMenuRadioItem value="system">
										<HugeiconsIcon
											icon={Computer}
											className="mr-2 h-4 w-4 opacity-70"
										/>
										{m.themeSystem()}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="light">
										<HugeiconsIcon
											icon={Sun}
											className="mr-2 h-4 w-4 opacity-70"
										/>
										{m.themeLight()}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="dark">
										<HugeiconsIcon
											icon={Moon}
											className="mr-2 h-4 w-4 opacity-70"
										/>
										{m.themeDark()}
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-16">
					<div className="w-full max-w-sm space-y-8">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">
								{m.registerTitle()}
							</h1>
							<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
								{m.registerDescription()}
							</p>
						</div>

						<registerForm.Field name="imagePreview">
							{(previewField) => (
								<registerForm.Field name="image">
									{(imageField) => (
										<div className="flex flex-col items-center gap-6 pt-4 pb-8 px-6 rounded-xl border border-border bg-linear-to-b from-accent/8 to-transparent">
											<button
												type="button"
												disabled={session.isPending}
												onClick={() => fileInputRef.current?.click()}
												className="group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full hover:scale-105 transition-transform duration-200"
												aria-label={m.profileImageLabel()}
											>
												<Avatar className="size-32 ring-4 ring-background shadow-lg">
													{previewField.state.value ? (
														<AvatarImage
															src={previewField.state.value}
															alt="Profile preview"
														/>
													) : null}
													<AvatarFallback className="bg-primary/10 border-2 border-primary/20">
														<HugeiconsIcon
															icon={Upload}
															className="h-8 w-8 text-primary/60"
														/>
													</AvatarFallback>
												</Avatar>
												<span className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/5 transition-colors duration-200" />
											</button>
											<div className="text-center space-y-1.5">
												<p className="text-xs font-medium text-muted-foreground">
													{m.profileImageLabel()}
												</p>
												<Button
													type="button"
													variant="outline"
													size="sm"
													disabled={session.isPending}
													onClick={() => fileInputRef.current?.click()}
													className="text-xs h-8"
												>
													<HugeiconsIcon
														icon={Upload}
														className="mr-1.5 h-3 w-3"
													/>
													{previewField.state.value
														? m.profileImageChange()
														: m.profileImageUpload()}
												</Button>
											</div>
											<input
												ref={fileInputRef}
												type="file"
												accept="image/*"
												className="hidden"
												onChange={(event) => {
													const file = event.target.files?.[0] ?? null;
													imageField.handleChange(file);
													if (file) {
														const url = URL.createObjectURL(file);
														previewField.handleChange(url);
													} else {
														previewField.handleChange('');
													}
												}}
											/>
										</div>
									)}
								</registerForm.Field>
							)}
						</registerForm.Field>

						<form onSubmit={handleSubmit}>
							<FieldGroup>
								<registerForm.Field name="name">
									{(nameField) => {
										const isInvalid =
											nameField.state.meta.isTouched &&
											!nameField.state.meta.isValid;

										return (
											<Field data-invalid={isInvalid} className="group">
												<FieldLabel
													htmlFor={nameField.name}
													className="text-sm font-medium"
												>
													{m.nameLabel()}
												</FieldLabel>
												<Input
													id={nameField.name}
													name="name"
													placeholder={m.namePlaceholder()}
													aria-invalid={isInvalid}
													value={nameField.state.value}
													onChange={(event) =>
														nameField.handleChange(event.target.value)
													}
													disabled={session.isPending}
													autoComplete="name"
													className="bg-muted/30 border-border group-focus-within:border-primary/50 group-focus-within:bg-muted/50 transition-all duration-200"
												/>
												<FieldError errors={nameField.state.meta.errors} />
											</Field>
										);
									}}
								</registerForm.Field>

								<registerForm.Field name="email">
									{(emailField) => {
										const isInvalid =
											emailField.state.meta.isTouched &&
											!emailField.state.meta.isValid;

										return (
											<Field data-invalid={isInvalid} className="group">
												<FieldLabel
													htmlFor={emailField.name}
													className="text-sm font-medium"
												>
													{m.emailLabel()}
												</FieldLabel>
												<Input
													id={emailField.name}
													name={emailField.name}
													placeholder={m.emailPlaceholder()}
													aria-invalid={isInvalid}
													value={emailField.state.value}
													onChange={(event) =>
														emailField.handleChange(event.target.value)
													}
													disabled={session.isPending}
													autoComplete="email"
													className="bg-muted/30 border-border group-focus-within:border-primary/50 group-focus-within:bg-muted/50 transition-all duration-200"
												/>
												<FieldError errors={emailField.state.meta.errors} />
											</Field>
										);
									}}
								</registerForm.Field>

								<div className="grid grid-cols-2 gap-3">
									<registerForm.Field name="password">
										{(passwordField) => {
											const isInvalid =
												passwordField.state.meta.isTouched &&
												!passwordField.state.meta.isValid;

											return (
												<Field data-invalid={isInvalid} className="group">
													<FieldLabel
														htmlFor={passwordField.name}
														className="text-sm font-medium"
													>
														{m.passwordLabel()}
													</FieldLabel>
													<Input
														id={passwordField.name}
														name={passwordField.name}
														type="password"
														placeholder="••••••••"
														aria-invalid={isInvalid}
														value={passwordField.state.value}
														onChange={(event) =>
															passwordField.handleChange(event.target.value)
														}
														disabled={session.isPending}
														autoComplete="new-password"
														className="bg-muted/30 border-border group-focus-within:border-primary/50 group-focus-within:bg-muted/50 transition-all duration-200"
													/>
													<FieldError
														errors={passwordField.state.meta.errors}
													/>
												</Field>
											);
										}}
									</registerForm.Field>

									<registerForm.Field name="confirmPassword">
										{(confirmField) => {
											const isInvalid =
												confirmField.state.meta.isTouched &&
												!confirmField.state.meta.isValid;

											return (
												<Field data-invalid={isInvalid} className="group">
													<FieldLabel
														htmlFor={confirmField.name}
														className="text-sm font-medium"
													>
														{m.confirmPasswordLabel()}
													</FieldLabel>
													<Input
														id={confirmField.name}
														name={confirmField.name}
														type="password"
														placeholder="••••••••"
														aria-invalid={isInvalid}
														value={confirmField.state.value}
														onChange={(event) =>
															confirmField.handleChange(event.target.value)
														}
														disabled={session.isPending}
														autoComplete="new-password"
														className="bg-muted/30 border-border group-focus-within:border-primary/50 group-focus-within:bg-muted/50 transition-all duration-200"
													/>
													<FieldError errors={confirmField.state.meta.errors} />
												</Field>
											);
										}}
									</registerForm.Field>
								</div>

								<Button
									type="submit"
									disabled={session.isPending}
									className="w-full"
									size="lg"
								>
									{session.isPending ? m.registerLoading() : m.registerButton()}
								</Button>
							</FieldGroup>
						</form>

						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Separator className="flex-1" />
								<span className="text-xs text-muted-foreground px-1">or</span>
								<Separator className="flex-1" />
							</div>
							<Button
								variant="outline"
								className="w-full"
								size="lg"
								disabled={session.isPending}
							>
								{m.registerWithGoogle()}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
