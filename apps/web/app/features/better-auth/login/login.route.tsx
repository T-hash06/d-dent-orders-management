import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
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
	toast,
	Link as UiLink,
} from '@full-stack-template/ui';
import { Computer, Moon, Sun } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import { type SubmitEvent, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import {
	errorCodes,
	isValidBetterAuthErrorCode,
	signIn,
	useClientSession,
} from '@/features/better-auth/better-auth-client.lib';
import {
	LOGIN_FORM_OPTIONS,
	useAppForm,
} from '@/features/better-auth/login/login.form';
import { m } from '@/features/i18n/paraglide/messages';
import {
	getLocale,
	localizeHref,
	setLocale,
} from '@/features/i18n/paraglide/runtime';

export default function LoginRoute() {
	const { theme, setTheme } = useTheme();
	const navigate = useNavigate();
	const session = useClientSession();
	const loginForm = useAppForm({
		...LOGIN_FORM_OPTIONS,
		onSubmit: async ({ value, formApi }) => {
			const { email, password } = value;

			try {
				const { data, error } = await signIn.email({ email, password });

				if (!error) {
					toast.success(m.loginSuccess({ email: data.user.email }));
					return navigate(localizeHref('/'));
				}

				if (!isValidBetterAuthErrorCode(error.code)) {
					console.error('Unkown error at login', error);
					toast.error(`${m.loginFailed()}: ${error.code} - ${error.message}`);
					return;
				}

				if (error.code === 'INVALID_EMAIL_OR_PASSWORD') {
					formApi.setErrorMap({
						onSubmit: {
							fields: {
								email: {
									message: m.invalidEmailOrPassword(),
								},
								password: {
									message: m.invalidEmailOrPassword(),
								},
							},
						},
					});
				}

				const key = errorCodes[error.code];
				return toast.error(m[key]());
			} catch (err) {
				console.error(m.loginErrorConsole(), err);
				toast.error(`${m.loginFailed()}: ${m.unknownError()}`);
			}
		},
	});

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await loginForm.handleSubmit();
		},
		[loginForm.handleSubmit],
	);

	return (
		<div className="min-h-dvh w-dvw max-w-full overflow-x-hidden flex items-center justify-center bg-linear-to-br from-background to-primary/10 dark:from-primary/10 dark:to-background p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-2">
					<CardTitle className="text-2xl font-bold">{m.loginTitle()}</CardTitle>
					<CardDescription>{m.loginDescription()}</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup className="space-y-2">
							<loginForm.Field name="email">
								{(emailField) => {
									const isInvalid =
										emailField.state.meta.isTouched &&
										!emailField.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={emailField.name}>
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
											/>
											<FieldError errors={emailField.state.meta.errors} />
										</Field>
									);
								}}
							</loginForm.Field>

							<loginForm.Field name="password">
								{(passwordField) => {
									const isInvalid =
										passwordField.state.meta.isTouched &&
										!passwordField.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<div className="flex items-center justify-between">
												<FieldLabel htmlFor={passwordField.name}>
													{m.passwordLabel()}
												</FieldLabel>
												<UiLink
													render={
														<Link to={localizeHref('/auth/forgot-password')} />
													}
													className="text-xs"
												>
													{m.forgotPassword()}
												</UiLink>
											</div>
											<Input
												id={passwordField.name}
												type="password"
												placeholder={m.passwordPlaceholder()}
												aria-invalid={isInvalid}
												value={passwordField.state.value}
												onChange={(event) =>
													passwordField.handleChange(event.target.value)
												}
												disabled={session.isPending}
												autoComplete="current-password"
											/>
											<FieldError errors={passwordField.state.meta.errors} />
										</Field>
									);
								}}
							</loginForm.Field>

							<Button
								type="submit"
								disabled={session.isPending}
								className="w-full"
								size="lg"
							>
								{session.isPending ? m.loginLoading() : m.loginButton()}
							</Button>
						</FieldGroup>
					</form>
				</CardContent>

				<CardFooter className="flex flex-col gap-3">
					<Button
						variant="outline"
						className="w-full"
						size="lg"
						disabled={session.isPending}
					>
						{m.loginWithGoogle()}
					</Button>

					<div className="pt-2 text-center text-sm">
						{m.noAccount()}{' '}
						<UiLink render={<Link to={localizeHref('/auth/register')} />}>
							{m.registerHere()}
						</UiLink>
					</div>
				</CardFooter>
			</Card>

			<div className="absolute top-4 right-4">
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<Button variant="outline" size="icon" />}
					>
						<HugeiconsIcon
							icon={
								theme === 'system' ? Computer : theme === 'light' ? Sun : Moon
							}
							className="h-5 w-5"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
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

			<div className="absolute top-4 left-4">
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<Button variant="outline" size="icon" />}
					>
						{getLocale().toUpperCase()}
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-auto">
						<DropdownMenuGroup>
							<DropdownMenuLabel>{m.selectLanguage()}</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={getLocale()}
								onValueChange={(locale) => {
									setLocale(locale);
								}}
							>
								<DropdownMenuRadioItem value="en">
									{m.languageEnglish()}
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="es">
									{m.languageSpanish()}
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
