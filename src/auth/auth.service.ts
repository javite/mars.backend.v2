import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        };
    }

    async register(createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return this.login(user);
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            return { message: 'If user exists, email sent' };
        }
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await this.usersService.update(user.id, { resetPasswordToken: token } as any);

        console.log(`[MOCK EMAIL] Password Reset Token for ${email}: ${token}`);

        return { message: 'If user exists, email sent' };
    }

    async resetPassword(token: string, newPass: string) {
        // Note: In production, use a more efficient lookup (e.g. findByToken)
        const allUsers = await this.usersService.findAll();
        const user = allUsers.find(u => u.resetPasswordToken === token);

        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }

        await this.usersService.update(user.id, {
            password: newPass,
            resetPasswordToken: null
        } as any);

        return { message: 'Password reset successful' };
    }
}
